# Reddit Mass Subscriber

A Tampermonkey script that helps you mass subscribe to subreddits with advanced filtering options.

## Features

- Mass subscribe to multiple subreddits at once
- Filter by minimum subscriber count
- Filter by SFW/NSFW content
- Blacklist for unwanted subreddits
- Remembers manually unsubscribed subreddits
- Smart duplicate handling
- Progress tracking and status updates

## Installation

1. Install Tampermonkey:
   - [Chrome Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge Add-on](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. Install the script:
   - Click [here](reddit-mass-subscriber.user.js) to view the script
   - Click the "Raw" button
   - Tampermonkey will detect the script and open its installation page
   - Click "Install" to add the script

## Usage

1. Go to [old.reddit.com](https://old.reddit.com)
2. Make sure you're logged into your Reddit account
3. Look for the control panel in the top-right corner
4. Configure your preferences:
   - **Minimum Subscribers**: Only subscribe to subreddits with at least this many subscribers
   - **Number of Subreddits**: How many subreddits to subscribe to in one go
   - **Content Filter**: Choose between SFW only, NSFW only, or both

5. Click "Start Mass Subscribe" and watch the progress!

## Features in Detail

### Subscription Filtering
- Set minimum subscriber count to find active communities
- Filter by SFW/NSFW content type
- Automatically skips subreddits you're already subscribed to

### Blacklist System
- Automatically remembers subreddits you manually unsubscribe from
- Won't try to resubscribe to blacklisted subreddits
- Blacklist persists across browser sessions

### Smart Handling
- Checks subscription status before attempting to subscribe
- Handles rate limiting automatically
- Shows detailed progress and status updates
- Continues until target is reached or runs out of matching subreddits

## Troubleshooting

1. **Script not working?**
   - Make sure you're on old.reddit.com
   - Verify you're logged into Reddit
   - Check if Tampermonkey is enabled

2. **Can't see the control panel?**
   - The panel appears in the top-right corner
   - Try refreshing the page
   - Make sure no other extensions are blocking it

3. **Subscription errors?**
   - Reddit might be rate limiting - the script handles this automatically
   - Check your internet connection
   - Make sure you're still logged in

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.