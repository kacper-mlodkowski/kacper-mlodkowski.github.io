import Head from 'next/head';
import styles from '../styles/Contact.module.css';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Kacper's Website - Contact</title>
        <meta name="description" content="Contact Kacper" />
      </Head>
      <div>
        <h1>Contact Me</h1>
        <p>Feel free to reach out if you'd like to get in touch!</p>

        <div className={styles.contactInfo}>
          <h3>Get in Touch</h3>
          <p>
            <strong>Email:</strong> your.email@example.com
          </p>
          <p>
            <strong>LinkedIn:</strong>{' '}
            <a href="#" target="_blank" rel="noopener noreferrer">
              linkedin.com/in/yourprofile
            </a>
          </p>
          <p>
            <strong>GitHub:</strong>{' '}
            <a href="#" target="_blank" rel="noopener noreferrer">
              github.com/yourusername
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

