# Shared Blog Avatar Cropper Design

## Goal

Give every blogger the same 1:1 avatar-cropping workflow while keeping blog avatars isolated from homepage image settings and from other bloggers.

## Approved Behavior

- Clicking the Blog Profile avatar opens the image picker.
- Selecting an image opens a square crop dialog before upload.
- The blogger can drag the image, adjust zoom, cancel, or crop and upload.
- The cropped result is a square JPEG and replaces only that blogger's saved channel avatar.
- The existing 16:9 cover uploader is unchanged.
- Every blogger uses the same component and API path; account role does not alter the layout or workflow.

## Isolation and Fallbacks

- Uploaded blog avatars live only in `blog_channels.avatar_url` for the authenticated username.
- Homepage profile/image settings are never read or written by the cropper.
- If a channel has no avatar, the public channel and Blog Profile editor use the shared `/assets/cards/local-blog.png` fallback file directly.
- Reusing the asset file does not connect the homepage and blog data fields.

## Interaction and Accessibility

- The crop dialog is keyboard-focusable, labelled, and provides explicit Cancel and Crop & Upload buttons.
- The preview is always 1:1 and prevents dragging far enough to expose blank edges.
- Zoom runs from 1x through 3x.
- Mobile uses the same controls in a narrower dialog.
