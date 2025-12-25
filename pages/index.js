import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Kacper's Website - Home</title>
        <meta name="description" content="Welcome to Kacper's website" />
      </Head>
      <div>
        <h1>Welcome to Kacper's website</h1>
        <p>My first website</p>
        <p style={{ marginTop: '1rem' }}>
          This is the home page. Use the navigation bar on the left to explore other sections of the website.
        </p>
      </div>
    </>
  );
}

