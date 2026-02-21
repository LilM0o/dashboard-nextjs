const http = require('http');

const options = {
  hostname: '100.86.54.54',
  port: 5454,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Count script tags
    const scriptMatches = data.match(/<script.*\/script>/g) || [];
    console.log(`Total script tags: ${scriptMatches.length}`);
    
    // Check for specific Next.js patterns
    if (data.includes('__next_f')) {
      console.log('✓ Next.js hydration scripts found');
    } else {
      console.log('✗ No Next.js hydration scripts found');
    }
    
    if (data.includes('useSWR')) {
      console.log('✓ SWR hooks found in HTML');
    } else {
      console.log('✗ No SWR hooks in HTML');
    }
    
    // Check for loading placeholders
    const loadingCount = (data.match(/Chargement/g) || []).length;
    console.log(`Total "Chargement" strings: ${loadingCount}`);
    
    // Check if client-side rendering is enabled
    if (data.includes('"_next/data')) {
      console.log('✓ Data requests found (server-side rendering enabled)');
    } else {
      console.log('✗ No data requests found (static export)');
    }
    
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
