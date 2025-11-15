#!/usr/bin/env python3
"""
EventShare Backend API Testing Suite
Tests all API endpoints for the event-based photo sharing app
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone
import uuid
import os
from pathlib import Path

class EventShareAPITester:
    def __init__(self, base_url="https://snapgather-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.guest_session_token = None
        self.test_user_id = None
        self.test_guest_id = None
        self.test_event_id = None
        self.test_media_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None, cookies=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.session_token and not headers:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
            
        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, cookies=cookies)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for multipart/form-data
                    if 'Content-Type' in test_headers:
                        del test_headers['Content-Type']
                    response = requests.post(url, files=files, data=data, headers=test_headers, cookies=cookies)
                else:
                    response = requests.post(url, json=data, headers=test_headers, cookies=cookies)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, cookies=cookies)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, cookies=cookies)
                
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}
                
        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}
    
    def create_test_session(self):
        """Create a test session using guest auth"""
        self.log("Creating test guest session...")
        success, response = self.run_test(
            "Create Guest Session",
            "POST",
            "auth/guest-session",
            200,
            data={"name": f"Test User {datetime.now().strftime('%H%M%S')}"}
        )
        
        if success and 'session_token' in response:
            self.guest_session_token = response['session_token']
            self.test_guest_id = response['user']['id']
            self.log(f"✅ Guest session created: {self.guest_session_token[:20]}...")
            return True
        return False
    
    def create_host_session(self):
        """Create a mock host session by directly inserting into database"""
        self.log("Creating mock host session...")
        
        # Create a host user directly in the database
        import pymongo
        
        try:
            # Connect to MongoDB directly
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client.test_database
            
            # Create host user
            host_user_id = str(uuid.uuid4())
            session_token = str(uuid.uuid4())
            expires_at = datetime.now(datetime.timezone.utc) + timedelta(days=1)
            
            user_data = {
                "id": host_user_id,
                "email": f"test.host.{datetime.now().strftime('%H%M%S')}@example.com",
                "name": "Test Host",
                "picture": "https://via.placeholder.com/150",
                "auth_provider": "google",
                "role": "host",
                "created_at": datetime.now(datetime.timezone.utc).isoformat()
            }
            
            session_data = {
                "user_id": host_user_id,
                "session_token": session_token,
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.now(datetime.timezone.utc).isoformat()
            }
            
            # Insert into database
            db.users.insert_one(user_data)
            db.user_sessions.insert_one(session_data)
            
            self.session_token = session_token
            self.test_user_id = host_user_id
            self.log(f"✅ Host session created: {self.session_token[:20]}...")
            
            client.close()
            return True
            
        except Exception as e:
            self.log(f"❌ Failed to create host session: {str(e)}")
            return False
    
    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        self.log("=== Testing Authentication Endpoints ===")
        
        # Test guest session creation
        if not self.create_test_session():
            return False
            
        # Test /auth/me with guest session
        success, response = self.run_test(
            "Get Current User (Guest)",
            "GET",
            "auth/me",
            200,
            headers={'Authorization': f'Bearer {self.guest_session_token}'}
        )
        
        # Create host session for further tests
        if not self.create_host_session():
            return False
            
        # Test /auth/me with host session
        success, response = self.run_test(
            "Get Current User (Host)",
            "GET", 
            "auth/me",
            200
        )
        
        return True
    
    def test_event_endpoints(self):
        """Test event management endpoints"""
        self.log("=== Testing Event Endpoints ===")
        
        # Test create event
        event_data = {
            "title": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "description": "Test event description",
            "start_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "location": "Test Location"
        }
        
        success, response = self.run_test(
            "Create Event",
            "POST",
            "events",
            200,
            data=event_data
        )
        
        if success and 'id' in response:
            self.test_event_id = response['id']
            self.log(f"✅ Event created: {self.test_event_id}")
        else:
            self.log("❌ Failed to create event, skipping event tests")
            return False
            
        # Test get events
        success, response = self.run_test(
            "Get My Events",
            "GET",
            "events",
            200
        )
        
        # Test get specific event
        success, response = self.run_test(
            "Get Event Details",
            "GET",
            f"events/{self.test_event_id}",
            200
        )
        
        # Test update event settings
        success, response = self.run_test(
            "Update Event Settings",
            "PUT",
            f"events/{self.test_event_id}/settings",
            200,
            data={"allow_upload": True, "require_approval": False}
        )
        
        # Test get event members
        success, response = self.run_test(
            "Get Event Members",
            "GET",
            f"events/{self.test_event_id}/members",
            200
        )
        
        return True
    
    def test_join_event(self):
        """Test event joining functionality"""
        self.log("=== Testing Event Join Endpoints ===")
        
        if not self.test_event_id:
            self.log("❌ No test event available, skipping join tests")
            return False
            
        # First get the event to find the join code
        success, event_response = self.run_test(
            "Get Event for Join Code",
            "GET",
            f"events/{self.test_event_id}",
            200
        )
        
        if not success or 'join_code' not in event_response:
            self.log("❌ Could not get join code")
            return False
            
        join_code = event_response['join_code']
        self.log(f"Using join code: {join_code}")
        
        # Test join event
        success, response = self.run_test(
            "Join Event",
            "POST",
            "events/join",
            200,
            data={
                "join_code": join_code,
                "user_name": f"Guest User {datetime.now().strftime('%H%M%S')}"
            },
            headers={}  # No auth header for join
        )
        
        return success
    
    def test_media_endpoints(self):
        """Test media upload and management endpoints"""
        self.log("=== Testing Media Endpoints ===")
        
        if not self.test_event_id:
            self.log("❌ No test event available, skipping media tests")
            return False
            
        # Create a test image file
        test_image_path = "/tmp/test_image.jpg"
        try:
            # Create a simple test image (1x1 pixel)
            from PIL import Image
            img = Image.new('RGB', (100, 100), color='red')
            img.save(test_image_path, 'JPEG')
        except ImportError:
            # Fallback: create a fake image file
            with open(test_image_path, 'wb') as f:
                f.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00d\x00d\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
        
        # Test upload media
        with open(test_image_path, 'rb') as f:
            files = {'files': ('test.jpg', f, 'image/jpeg')}
            form_data = {'captions': 'Test photo caption'}
            
            success, response = self.run_test(
                "Upload Media",
                "POST",
                f"events/{self.test_event_id}/media",
                200,
                data=form_data,
                files=files
            )
            
        if success and 'media_items' in response and len(response['media_items']) > 0:
            self.test_media_id = response['media_items'][0]['id']
            self.log(f"✅ Media uploaded: {self.test_media_id}")
        
        # Test get event media
        success, response = self.run_test(
            "Get Event Media",
            "GET",
            f"events/{self.test_event_id}/media",
            200
        )
        
        # Test get media file
        if self.test_media_id:
            success, response = self.run_test(
                "Get Media File",
                "GET",
                f"media/{self.test_media_id}/file",
                200
            )
        
        # Clean up test file
        try:
            os.unlink(test_image_path)
        except:
            pass
            
        return True
    
    def test_qr_code_endpoint(self):
        """Test QR code endpoint"""
        self.log("=== Testing QR Code Endpoint ===")
        
        if not self.test_event_id:
            self.log("❌ No test event available, skipping QR code test")
            return False
            
        # Test QR code access
        success, response = self.run_test(
            "Get QR Code",
            "GET",
            f"qr-codes/{self.test_event_id}.png",
            200
        )
        
        return success
    
    def cleanup_test_data(self):
        """Clean up test data"""
        self.log("=== Cleaning Up Test Data ===")
        
        # Delete test media
        if self.test_media_id:
            self.run_test(
                "Delete Test Media",
                "DELETE",
                f"media/{self.test_media_id}",
                200
            )
        
        # Delete test event
        if self.test_event_id:
            self.run_test(
                "Delete Test Event",
                "DELETE",
                f"events/{self.test_event_id}",
                200
            )
        
        # Logout sessions
        if self.session_token:
            self.run_test(
                "Logout Host Session",
                "POST",
                "auth/logout",
                200
            )
            
        if self.guest_session_token:
            self.run_test(
                "Logout Guest Session",
                "POST",
                "auth/logout",
                200,
                headers={'Authorization': f'Bearer {self.guest_session_token}'}
            )
    
    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting EventShare API Tests")
        self.log(f"Testing against: {self.base_url}")
        
        try:
            # Test authentication
            if not self.test_auth_endpoints():
                self.log("❌ Auth tests failed, stopping")
                return False
                
            # Test events
            if not self.test_event_endpoints():
                self.log("❌ Event tests failed, continuing with other tests")
                
            # Test event joining
            self.test_join_event()
            
            # Test media
            self.test_media_endpoints()
            
            # Test QR codes
            self.test_qr_code_endpoint()
            
        finally:
            # Always try to clean up
            self.cleanup_test_data()
        
        # Print results
        self.log("=" * 50)
        self.log(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            self.log("❌ Failed Tests:")
            for test in self.failed_tests:
                self.log(f"   - {test}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EventShareAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())