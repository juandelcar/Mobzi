/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import styles from "./intro.module.css";

export default function IntroPage() {
  return (
    <div className={styles.introContainer}>
      {/* Efectos de fondo */}
      <div className={styles.backgroundEffect1}></div>
      <div className={styles.backgroundEffect2}></div>

      {/* Contenedor principal */}
      <div className={styles.mainContent}>
        {/* Sección izquierda */}
        <section className={styles.leftSection}>
          <div className={styles.logoContainer}>
            <img src="/circular_icon.png" alt="MOBZI Logo" className={styles.logo} />
            <h1 className={styles.title}>MOBZI</h1>
          </div>
          <p className={styles.subtitle}>
            <b>MOBZI</b> te ayudará a planear y optimizar tus rutas diarias de
            transporte público. Encuentra paradas rutas y las mejores opciones
            de movilidad de manera rápida y confiable.
          </p>
          <Link href="/auth/login" className={styles.primaryButton}>
            Inicia sesión
          </Link>
          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
          </div>
          <br />
          <Link href="/auth/register" className={styles.secondaryButton}>
            ¡Crea una cuenta ahora!
          </Link>
        </section>

        {/* Sección derecha con ilustración */}
        <section className={styles.rightSection}>
          <img
            src="/square_logo.png"
            alt="Ilustración de transporte público"
            className={styles.illustration}
          />
        </section>
      </div>
    </div>
  );
}
