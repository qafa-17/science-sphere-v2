import type { Metadata } from "next";
import PitchForm from "@/components/PitchForm";
import styles from "./pitch.module.css";

export const metadata: Metadata = {
  title: "Pitch a Story · Science Sphere",
  description: "Write, draw, film or record something about science for Science Sphere, MRU's student science magazine.",
};

export default function PitchPage() {
  return (
    <main className={styles.page}>
      <div className="wrap">
        <header className={styles.hero}>
          <p className="label">specimen // pitch_form // open call</p>
          <h1 className={styles.title}>Pitch a Story</h1>
          <p className={styles.lede}>
            Write an article, poem, letter or op-ed. Draw something that inspires you about your discipline. Make a collage.
            Share your research or your journey. Whatever science idea you have, we want to hear about it.
          </p>
          <p className={styles.lede2}>Fill in the form on the left; the guide on the right helps you shape each part.</p>
        </header>
        <PitchForm />
      </div>
    </main>
  );
}
