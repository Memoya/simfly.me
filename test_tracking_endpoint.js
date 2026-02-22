// Check if VisitorTracker is being called
console.log('[DEBUG] Checking VisitorTracker activity...');

// Open browser console on https://simfly.me/de
// Copy-paste this code there to see what's happening:

(async () => {
  console.log('📊 Testing if /api/track endpoint works...');
  
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-' + Date.now(),
        page: '/de',
        lang: 'de',
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      })
    });
    
    console.log('✅ Response status:', response.status);
    const data = await response.json();
    console.log('📝 Response data:', data);
    
    if (response.ok) {
      console.log('✅ SUCCESS! /api/track is working!');
    } else {
      console.error('❌ ERROR! Response not OK:', response.statusText);
    }
  } catch (error) {
    console.error('❌ ERROR calling /api/track:', error);
  }
})();
