// ==UserScript==
// @name         Reddit Mass Subscriber
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Mass subscribe to subreddits with advanced filtering and unsubscribe tracking
// @author       You
// @match        https://old.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Initialize blacklist in localStorage
    const BLACKLIST_KEY = 'reddit_mass_subscriber_blacklist';
    let blacklistedSubs = new Set(JSON.parse(localStorage.getItem(BLACKLIST_KEY) || '[]'));

    // Monitor unsubscribe clicks
    function setupUnsubscribeMonitor() {
        document.addEventListener('click', (e) => {
            const unsubButton = e.target.closest('.remove');
            if (!unsubButton) return;

            const toggleButton = unsubButton.closest('.fancy-toggle-button');
            if (!toggleButton) return;

            const subredditName = toggleButton.dataset.sr_name;
            if (!subredditName) return;

            // Add to blacklist after successful unsubscribe
            const originalXHR = window.XMLHttpRequest;
            const tempXHR = function() {
                const xhr = new originalXHR();
                const originalSend = xhr.send;

                xhr.send = function() {
                    xhr.addEventListener('load', () => {
                        if (xhr.status === 200) {
                            blacklistedSubs.add(subredditName.toLowerCase());
                            localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...blacklistedSubs]));
                            console.log(`🚫 Added r/${subredditName} to subscription blacklist`);
                        }
                    });
                    originalSend.apply(xhr, arguments);
                };

                return xhr;
            };

            window.XMLHttpRequest = tempXHR;
            setTimeout(() => {
                window.XMLHttpRequest = originalXHR;
            }, 1000);
        }, true);
    }

    // UI Elements
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: white;
        padding: 15px;
        border: 1px solid #ccc;
        border-radius: 5px;
        z-index: 100;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    // Style for inputs and labels
    const inputStyle = `
        width: 100%;
        padding: 5px;
        margin: 5px 0;
        border: 1px solid #ccc;
        border-radius: 3px;
        box-sizing: border-box;
    `;

    // Create form elements
    const form = document.createElement('form');
    form.style.margin = '0';

    // Min subscribers input
    const minSubsLabel = document.createElement('label');
    minSubsLabel.textContent = 'Minimum Subscribers:';
    const minSubsInput = document.createElement('input');
    minSubsInput.type = 'number';
    minSubsInput.value = '500';
    minSubsInput.style.cssText = inputStyle;

    // Max subreddits input
    const maxSubsLabel = document.createElement('label');
    maxSubsLabel.textContent = 'Number of Subreddits to Subscribe:';
    const maxSubsInput = document.createElement('input');
    maxSubsInput.type = 'number';
    maxSubsInput.value = '50';
    maxSubsInput.style.cssText = inputStyle;

    // NSFW filter
    const nsfwLabel = document.createElement('label');
    nsfwLabel.textContent = 'Content Filter:';
    const nsfwSelect = document.createElement('select');
    nsfwSelect.style.cssText = inputStyle;
    
    const options = [
        { value: 'sfw', text: 'SFW Only' },
        { value: 'nsfw', text: 'NSFW Only' },
        { value: 'both', text: 'Both SFW & NSFW' }
    ];
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        nsfwSelect.appendChild(option);
    });

    // Blacklist count
    const blacklistCount = document.createElement('div');
    blacklistCount.style.cssText = `
        font-size: 11px;
        color: #666;
        margin-top: 5px;
    `;
    blacklistCount.textContent = `Blacklisted subreddits: ${blacklistedSubs.size}`;

    // Start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Mass Subscribe';
    startButton.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-top: 10px;
        background: #0079d3;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-weight: bold;
    `;
    startButton.onmouseover = () => startButton.style.backgroundColor = '#005fa3';
    startButton.onmouseout = () => startButton.style.backgroundColor = '#0079d3';

    // Status display
    const status = document.createElement('div');
    status.style.cssText = `
        margin-top: 10px;
        padding: 5px;
        font-size: 12px;
        border-radius: 3px;
        word-wrap: break-word;
    `;

    // Assemble the form
    form.appendChild(minSubsLabel);
    form.appendChild(minSubsInput);
    form.appendChild(maxSubsLabel);
    form.appendChild(maxSubsInput);
    form.appendChild(nsfwLabel);
    form.appendChild(nsfwSelect);
    form.appendChild(blacklistCount);
    form.appendChild(startButton);
    form.appendChild(status);
    container.appendChild(form);
    document.body.appendChild(container);

    // Get Reddit's modhash token
    function getModhash() {
        return window.reddit?.config?.modhash || 
               document.querySelector('input[name="uh"]')?.value;
    }

    // Get user's current subscriptions
    async function getCurrentSubscriptions() {
        const subs = new Set();
        let after = '';
        let totalFetched = 0;
        
        while (true) {
            console.log(`🔄 Fetching subscriptions page (after: ${after})`);
            const response = await fetch(`/subreddits/mine/subscriber.json?limit=100&after=${after}`);
            const data = await response.json();
            
            const newSubs = data.data.children.map(sub => sub.data.display_name.toLowerCase());
            newSubs.forEach(sub => subs.add(sub));
            totalFetched += newSubs.length;
            
            console.log(`📊 Fetched ${newSubs.length} subs, total so far: ${totalFetched}`);
            
            // If we got less than 100 results or no 'after' token, we're done
            if (newSubs.length < 100 || !data.data.after) {
                break;
            }
            
            after = data.data.after;
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('🔍 All current subscriptions:', {
            total: subs.size,
            subscriptions: [...subs].sort()
        });
        
        return subs;
    }

    // Subscribe to a subreddit
    async function subscribeToSubreddit(subredditName, subredditId) {
        // First check if already subscribed
        const currentSubs = await getCurrentSubscriptions();
        const normalizedName = subredditName.toLowerCase();
        
        console.log(`🔍 Checking subscription for r/${subredditName}:`, {
            subredditName,
            normalizedName,
            isSubscribed: currentSubs.has(normalizedName),
            currentSubs: [...currentSubs]
        });

        if (currentSubs.has(normalizedName)) {
            throw new Error('ALREADY_SUBSCRIBED');
        }

        const modhash = getModhash();
        if (!modhash) {
            throw new Error('Not logged in! Please log in to Reddit first.');
        }

        const data = new URLSearchParams({
            sr: subredditId,
            action: 'sub',
            r: subredditName,
            uh: modhash,
            renderstyle: 'html'
        });

        const response = await fetch('/api/subscribe', {
            method: 'POST',
            body: data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to subscribe to r/${subredditName}`);
        }

        return response.json();
    }

    // Get popular subreddits
    async function getPopularSubreddits(minSubs, nsfwFilter, currentSubs) {
        let after = '';
        let subreddits = [];
        
        console.log('🔍 Starting subreddit search with:', {
            minSubs,
            nsfwFilter,
            currentSubscriptions: [...currentSubs]
        });
        
        while (subreddits.length < 200) {  // Fetch more to account for filtering
            const response = await fetch(`/subreddits/popular.json?limit=100&after=${after}`);
            const data = await response.json();
            
            if (!data.data.children.length) break;
            
            const filtered = data.data.children
                .filter(sub => {
                    const subreddit = sub.data;
                    const name = subreddit.display_name.toLowerCase();
                    const isSubscribed = currentSubs.has(name);
                    const isBlacklisted = blacklistedSubs.has(name);
                    const meetsSubCount = subreddit.subscribers >= minSubs;
                    const meetsNsfwFilter = nsfwFilter === 'both' ? true :
                                          nsfwFilter === 'nsfw' ? subreddit.over18 :
                                          !subreddit.over18;
                    
                    // Log details for each subreddit being checked
                    console.log(`🔍 Filtering r/${subreddit.display_name}:`, {
                        name,
                        isSubscribed,
                        isBlacklisted,
                        subscribers: subreddit.subscribers,
                        meetsSubCount,
                        isNSFW: subreddit.over18,
                        meetsNsfwFilter
                    });
                    
                    return !isSubscribed && !isBlacklisted && meetsSubCount && meetsNsfwFilter;
                })
                .map(sub => ({
                    name: sub.data.display_name,
                    id: sub.data.name,
                    subscribers: sub.data.subscribers,
                    nsfw: sub.data.over18
                }));
            
            subreddits = subreddits.concat(filtered);
            after = data.data.after;
            
            if (!after) break;
        }
        
        return subreddits;
    }

    // Main subscription process
    async function massSubscribe(minSubs, maxSubs, nsfwFilter) {
        try {
            status.textContent = 'Getting your current subscriptions...';
            let currentSubs = await getCurrentSubscriptions();
            
            status.textContent = 'Getting subreddit list...';
            const subreddits = await getPopularSubreddits(minSubs, nsfwFilter, currentSubs);
            
            if (subreddits.length === 0) {
                status.textContent = 'No matching subreddits found!';
                return;
            }

            let successCount = 0;
            let currentIndex = 0;

            status.textContent = `Found ${subreddits.length} potential subreddits. Starting...`;
            
            while (successCount < maxSubs && currentIndex < subreddits.length) {
                const sub = subreddits[currentIndex];
                try {
                    await subscribeToSubreddit(sub.name, sub.id);
                    successCount++;
                    status.textContent = `Subscribed to r/${sub.name} (${successCount}/${maxSubs})`;
                } catch (error) {
                    if (error.message === 'ALREADY_SUBSCRIBED') {
                        console.log(`Skipping r/${sub.name}: Already subscribed`);
                        status.textContent = `Skipping r/${sub.name} (already subscribed)`;
                    } else {
                        console.error(`Failed to subscribe to r/${sub.name}:`, error);
                        status.textContent = `Error with r/${sub.name}: ${error.message}`;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                
                currentIndex++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (successCount < maxSubs) {
                status.textContent = `Done! Subscribed to ${successCount} subreddits (ran out of matching subreddits).`;
            } else {
                status.textContent = `Done! Successfully subscribed to ${successCount} subreddits.`;
            }
        } catch (error) {
            status.textContent = `Error: ${error.message}`;
            console.error('Mass subscribe error:', error);
        }
    }

    // Start button click handler
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const minSubs = parseInt(minSubsInput.value) || 500;
        const maxSubs = parseInt(maxSubsInput.value) || 50;
        const nsfwFilter = nsfwSelect.value;
        massSubscribe(minSubs, maxSubs, nsfwFilter);
    });

    // Setup unsubscribe monitoring
    setupUnsubscribeMonitor();

    console.log('🚀 Reddit Mass Subscriber v3 Ready!');
})();