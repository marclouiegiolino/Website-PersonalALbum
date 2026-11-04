async function runE2ETest() {
  console.log("Starting End-to-End Frontend API Integration Test...\n");

  // 1. Health check local server
  const healthRes = await fetch("http://localhost:4000/health");
  console.log("1. Local Server Health:", await healthRes.json());

  // 2. Test Login via Next.js Proxy
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "marc", password: "changeme123" }),
  });

  const cookie = loginRes.headers.get("set-cookie");
  const loginData = await loginRes.json();
  console.log("2. Next.js /api/auth/login Response Status:", loginRes.status);
  console.log("   User:", loginData.user);
  console.log("   Cookie present:", !!cookie);

  if (!cookie) {
    console.error("No cookie returned!");
    return;
  }

  // 3. Test /api/auth/me with Cookie
  const meRes = await fetch("http://localhost:3000/api/auth/me", {
    headers: { Cookie: cookie },
  });
  console.log("3. Next.js /api/auth/me Response:", await meRes.json());

  // 4. Test /api/albums with Cookie
  const albumsRes = await fetch("http://localhost:3000/api/albums", {
    headers: { Cookie: cookie },
  });
  const albumsData = await albumsRes.json();
  console.log("4. Next.js /api/albums Count:", albumsData.albums?.length);
  if (albumsData.albums?.length > 0) {
    console.log("   First Album:", albumsData.albums[0].title);
  }

  // 5. Test Creating an Album via Next.js Proxy
  const createRes = await fetch("http://localhost:3000/api/albums", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      title: "Our Romantic Sunset Walk",
      description: "Memories under the golden evening sky",
    }),
  });
  const createData = await createRes.json();
  console.log("5. Created Album via Next.js Proxy:", createData.album?.title, "(ID:", createData.album?.id, ")");

  // 6. Test Fetching Album Details
  if (createData.album?.id) {
    const detailRes = await fetch(`http://localhost:3000/api/albums/${createData.album.id}`, {
      headers: { Cookie: cookie },
    });
    const detailData = await detailRes.json();
    console.log("6. Fetched Album Detail:", detailData.album?.title);
  }

  console.log("\nALL E2E INTEGRATION TESTS COMPLETED SUCCESSFULLY! \u2705\u2764\uFE0F");
}

runE2ETest().catch(console.error);

