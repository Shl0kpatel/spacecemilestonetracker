# File Upload Integration Guide

## Overview
This milestone tracking system now supports direct file uploads to Cloudinary for parent submissions, replacing the previous URL-only system.

## Features Implemented

### Backend (Node.js + Express)
- ✅ **Cloudinary Integration**: Full setup with environment variables
- ✅ **Multer Storage**: Configured for both images and videos
- ✅ **File Upload Endpoint**: `/api/parents/milestone/submit-with-file`
- ✅ **Legacy URL Support**: Maintained backward compatibility
- ✅ **File Validation**: Type and size restrictions
- ✅ **Error Handling**: Comprehensive error responses

### Frontend (React)
- ✅ **Drag & Drop Interface**: Modern file upload UI
- ✅ **File Preview**: Shows selected file details
- ✅ **Upload Progress**: Real-time progress tracking
- ✅ **File Validation**: Client-side type/size checking
- ✅ **Media Viewer**: Enhanced media display for volunteers
- ✅ **Error Handling**: User-friendly error messages

## File Specifications

### Supported Formats
- **Images**: JPEG, PNG, GIF (max 5MB)
- **Videos**: MP4, MOV, AVI (max 50MB)

### Storage Configuration
- **Images**: Stored in `milestone-images/` folder
- **Videos**: Stored in `milestone-videos/` folder
- **Transformations**: Automatic resizing and optimization

## API Endpoints

### 1. File Upload Submission
```http
POST /api/parents/milestone/submit-with-file
Content-Type: multipart/form-data

FormData:
- media: File (image/video)
- childId: String
- milestoneId: String
```

### 2. Legacy URL Submission
```http
POST /api/parents/milestone/submit
Content-Type: application/json

{
  "childId": "string",
  "milestoneId": "string", 
  "mediaUrl": "string (optional)"
}
```

### 3. Test Upload (Debug)
```http
POST /api/parents/test-upload
Content-Type: multipart/form-data

FormData:
- media: File
```

## Database Schema Updates

### milestoneStatus.json
```json
{
  "_id": "string",
  "childId": "string",
  "milestoneId": "string",
  "status": "pending|accepted|rejected",
  "mediaUrl": "string (Cloudinary URL)",
  "mediaType": "image|video",
  "mediaSize": "number (MB)",
  "mediaDuration": "number (seconds, for videos)",
  "fileName": "string",
  "fileType": "string (MIME type)",
  "submittedAt": "ISO string",
  "reviewedAt": "ISO string",
  "reviewedBy": "number",
  "rejectionReason": "string",
  "feedback": "string"
}
```

## Environment Variables

### Required .env variables
```properties
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
PORT=3000
NODE_ENV=development
```

## Usage Examples

### Parent Dashboard
1. Click "Submit" on any not-started milestone
2. Choose to either:
   - Drag & drop a file into the upload area
   - Click to browse and select a file
   - Enter a URL in the legacy field
3. View upload progress in real-time
4. Submit when ready

### Volunteer Dashboard  
1. View submissions with media indicators (🖼️ for images, 🎥 for videos)
2. Click "View Media" to open media viewer modal
3. Preview images/videos directly in browser
4. Review and provide feedback

## Technical Implementation

### File Upload Flow
1. **Client**: User selects file → validation → FormData creation
2. **Multer**: Intercepts request → file validation
3. **Cloudinary**: Uploads file → returns URL + metadata
4. **Database**: Stores submission with Cloudinary URL
5. **Response**: Returns success with submission details

### Security Features
- File type validation (whitelist approach)
- File size limits (5MB images, 50MB videos)
- Cloudinary transformations (auto-optimization)
- Error handling for failed uploads
- MIME type checking

## Testing
- Backend: `npm start` (port 3000)
- Frontend: `npm run dev` (port 5173)
- Test endpoint: `POST /api/parents/test-upload`

## Next Steps
- [ ] Add video duration extraction
- [ ] Implement file compression options
- [ ] Add bulk upload functionality
- [ ] Create admin panel for media management
- [ ] Add media deletion capability
