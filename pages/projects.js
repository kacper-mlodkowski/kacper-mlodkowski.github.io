import Head from 'next/head';
import styles from '../styles/Projects.module.css';

export default function Projects() {
  return (
    <>
      <Head>
        <title>Kacper's Website - Projects</title>
        <meta name="description" content="Kacper's projects" />
      </Head>
      <div>
        <h1>My Projects</h1>
        <p>Here are some of my featured projects:</p>

        <div className={styles.projectCard}>
          <h3>Project 1</h3>
          <p>
            This is a sample project description. You can add details about your projects here, including technologies
            used, features, and links to live demos or repositories.
          </p>
        </div>

        <div className={styles.projectCard}>
          <h3>Project 2</h3>
          <p>
            Another sample project that showcases your work. Customize this section to highlight your best projects and
            achievements.
          </p>
        </div>

        <div className={styles.projectCard}>
          <h3>Project 3</h3>
          <p>
            A third project example. Add as many projects as you'd like to showcase your portfolio and skills.
          </p>
        </div>
      </div>
    </>
  );
}

