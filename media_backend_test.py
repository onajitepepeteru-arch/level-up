#!/usr/bin/env python3
"""
Media Backend Testing Suite for LevelUP Fitness App
Tests media upload and retrieval endpoints that support frontend media preview functionality
"""

import requests
import json
import os
import sys
from datetime import datetime
import uuid
import io
from pathlib import Path

# Load environment variables
sys.path.append('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

# Get backend URL from frontend environment
frontend_env_path = '/app/frontend/.env'
backend_url = None
if os.path.exists(frontend_env_path):
    with open(frontend_env_path, 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                backend_url = line.split('=', 1)[1].strip()
                break

if not backend_url:
    print("❌ ERROR: Could not find REACT_APP_BACKEND_URL in frontend/.env")
    sys.exit(1)

API_BASE_URL = f"{backend_url}/api"
print(f"🔗 Testing media backend at: {API_BASE_URL}")

class MediaBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def create_test_png(self):
        """Create a small test PNG file"""
        # Simple 1x1 PNG file (minimal valid PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        return png_data
    
    def create_test_mp4(self):
        """Create a minimal test MP4 file"""
        # Minimal MP4 header (not a real video, but valid for upload testing)
        mp4_data = b'\x00\x00\x00\x20ftypmp41\x00\x00\x00\x00mp41isom\x00\x00\x00\x08free'
        return mp4_data
    
    def test_server_health(self):
        """Test basic server connectivity"""
        print("\n🏥 Testing Server Health...")
        
        try:
            # Test media upload endpoint instead of root
            response = self.session.post(f"{API_BASE_URL}/media/upload", timeout=10)
            if response.status_code == 422:  # Expected error for missing file
                self.log_test("Server Connectivity", True, "Backend server is accessible (media endpoint responding)")
                return True
            else:
                self.log_test("Server Connectivity", False, f"Server returned status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Server Connectivity", False, f"Connection failed: {str(e)}")
            return False
    
    def test_media_upload_png(self):
        """Test PNG image upload"""
        print("\n🖼️ Testing PNG Image Upload...")
        
        try:
            png_data = self.create_test_png()
            
            files = {
                'file': ('test_image.png', png_data, 'image/png')
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/media/upload",
                files=files,
                timeout=15
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    media_id = result.get('id')
                    content_type = result.get('content_type')
                    filename = result.get('filename')
                    
                    if media_id and content_type and filename:
                        self.log_test("PNG Upload", True, 
                                    f"PNG uploaded successfully - ID: {media_id}, Type: {content_type}")
                        self.test_png_media_id = media_id
                        return True
                    else:
                        self.log_test("PNG Upload", False, 
                                    f"Response missing required fields: {result}")
                        return False
                except json.JSONDecodeError as e:
                    self.log_test("PNG Upload", False, f"Invalid JSON response: {str(e)}")
                    return False
            else:
                self.log_test("PNG Upload", False, 
                            f"Upload failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("PNG Upload", False, f"Upload error: {str(e)}")
            return False
    
    def test_media_upload_mp4(self):
        """Test MP4 video upload"""
        print("\n🎥 Testing MP4 Video Upload...")
        
        try:
            mp4_data = self.create_test_mp4()
            
            files = {
                'file': ('test_video.mp4', mp4_data, 'video/mp4')
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/media/upload",
                files=files,
                timeout=15
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    media_id = result.get('id')
                    content_type = result.get('content_type')
                    filename = result.get('filename')
                    
                    if media_id and content_type and filename:
                        self.log_test("MP4 Upload", True, 
                                    f"MP4 uploaded successfully - ID: {media_id}, Type: {content_type}")
                        self.test_mp4_media_id = media_id
                        return True
                    else:
                        self.log_test("MP4 Upload", False, 
                                    f"Response missing required fields: {result}")
                        return False
                except json.JSONDecodeError as e:
                    self.log_test("MP4 Upload", False, f"Invalid JSON response: {str(e)}")
                    return False
            else:
                self.log_test("MP4 Upload", False, 
                            f"Upload failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("MP4 Upload", False, f"Upload error: {str(e)}")
            return False
    
    def test_media_retrieval_png(self):
        """Test PNG media retrieval"""
        print("\n📥 Testing PNG Media Retrieval...")
        
        if not hasattr(self, 'test_png_media_id'):
            self.log_test("PNG Retrieval", False, "No PNG media ID available for testing")
            return False
        
        try:
            response = self.session.get(
                f"{API_BASE_URL}/media/{self.test_png_media_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                if 'image' in content_type.lower() and content_length > 0:
                    self.log_test("PNG Retrieval", True, 
                                f"PNG retrieved successfully - Type: {content_type}, Size: {content_length} bytes")
                    return True
                else:
                    self.log_test("PNG Retrieval", False, 
                                f"Invalid content - Type: {content_type}, Size: {content_length}")
                    return False
            else:
                self.log_test("PNG Retrieval", False, 
                            f"Retrieval failed with status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("PNG Retrieval", False, f"Retrieval error: {str(e)}")
            return False
    
    def test_media_retrieval_mp4(self):
        """Test MP4 media retrieval"""
        print("\n📥 Testing MP4 Media Retrieval...")
        
        if not hasattr(self, 'test_mp4_media_id'):
            self.log_test("MP4 Retrieval", False, "No MP4 media ID available for testing")
            return False
        
        try:
            response = self.session.get(
                f"{API_BASE_URL}/media/{self.test_mp4_media_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                if 'video' in content_type.lower() and content_length > 0:
                    self.log_test("MP4 Retrieval", True, 
                                f"MP4 retrieved successfully - Type: {content_type}, Size: {content_length} bytes")
                    return True
                else:
                    self.log_test("MP4 Retrieval", False, 
                                f"Invalid content - Type: {content_type}, Size: {content_length}")
                    return False
            else:
                self.log_test("MP4 Retrieval", False, 
                            f"Retrieval failed with status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("MP4 Retrieval", False, f"Retrieval error: {str(e)}")
            return False
    
    def test_large_file_rejection(self):
        """Test that files larger than 5MB are rejected"""
        print("\n🚫 Testing Large File Rejection...")
        
        try:
            # Create a file larger than 5MB (5 * 1024 * 1024 + 1 bytes)
            large_data = b'x' * (5 * 1024 * 1024 + 1)
            
            files = {
                'file': ('large_file.png', large_data, 'image/png')
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/media/upload",
                files=files,
                timeout=30
            )
            
            if response.status_code == 413:
                self.log_test("Large File Rejection", True, 
                            "Large file correctly rejected with 413 status")
                return True
            else:
                self.log_test("Large File Rejection", False, 
                            f"Expected 413 status, got: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Large File Rejection", False, f"Test error: {str(e)}")
            return False
    
    def test_invalid_media_id(self):
        """Test retrieval with invalid media ID"""
        print("\n❌ Testing Invalid Media ID...")
        
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.get(
                f"{API_BASE_URL}/media/{fake_id}",
                timeout=10
            )
            
            if response.status_code == 404:
                self.log_test("Invalid Media ID", True, 
                            "Invalid media ID correctly returns 404")
                return True
            else:
                self.log_test("Invalid Media ID", False, 
                            f"Expected 404 status, got: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Invalid Media ID", False, f"Test error: {str(e)}")
            return False
    
    def run_media_tests(self):
        """Run all media backend tests"""
        print("🎯 Starting Media Backend Testing Suite")
        print("Focus: Media Upload/Retrieval endpoints supporting frontend media preview")
        print("=" * 80)
        
        # Test server health first
        if not self.test_server_health():
            print("\n❌ Server health check failed. Stopping tests.")
            return False
        
        # Run media tests
        print("\n" + "=" * 80)
        print("📁 MEDIA ENDPOINTS TESTING")
        print("=" * 80)
        
        # Test PNG upload and retrieval
        png_upload_success = self.test_media_upload_png()
        if png_upload_success:
            self.test_media_retrieval_png()
        
        # Test MP4 upload and retrieval
        mp4_upload_success = self.test_media_upload_mp4()
        if mp4_upload_success:
            self.test_media_retrieval_mp4()
        
        # Test edge cases
        self.test_large_file_rejection()
        self.test_invalid_media_id()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 MEDIA TESTS SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        if total_tests > 0:
            print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = MediaBackendTester()
    success = tester.run_media_tests()
    
    if success:
        print("\n🎉 All media backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some media backend tests failed. Check logs above.")
        sys.exit(1)