# Blog Channel Profile Overlay Design

## Goal

Place the displayed blog channel owner's square profile picture on the channel cover photo while keeping the layout reusable for every blogger.

## Approved Layout

- Keep the blog name in the title bar above the cover.
- Remove the profile picture from that title bar.
- Overlay the profile picture in the upper-left area inside the cover.
- Render the profile picture as a strict 1:1 square.
- Keep the profile picture's entire box left of the cover's vertical midpoint.
- Scale the overlay down on smaller screens while preserving the same constraint.

## Data Behavior

The public channel continues to use `channel.avatar_url` and `channel.card_image_url` from the displayed channel. No profile image is shared or hardcoded, and the logged-in blogger's admin experience continues to inherit that blogger's saved channel data.

## Scope

Only the public blog channel markup, styling, and regression coverage change. The database, API, upload flow, blog posts, and unrelated site header remain unchanged.
