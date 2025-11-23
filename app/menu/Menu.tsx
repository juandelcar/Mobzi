"use client";

// @frontend/ Imports y dependencias
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./menu.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Menu() {
  // @frontend/ Estados del componente
  const router = useRouter();
  const { usuario, isAuthenticated, logout } = useAuth();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBurger, setIsBurger] = useState(true);

  // @frontend/ Efectos y lógica de scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastYRef.current && y > 24) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // @frontend/ Efectos del menú móvil
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("mobileMenuOpen");
    } else {
      document.body.classList.remove("mobileMenuOpen");
    }
  }, [mobileMenuOpen]);

  // @frontend/ Funciones de manejo
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setIsBurger(!isBurger);
  };

  return (
    <div>
      {/* @frontend/ Barra de navegación principal */}
      <nav
        className={`${styles.navbar} ${
          hidden ? styles.hiddenBar : styles.shownBar
        }`}
      >
        <div className={styles.inner}>
          {/* @frontend/ Logo y marca */}
          <div className={styles.brand}>
            <Image 
              src="/square_logo.png" 
              alt="MOBZI Icon" 
              className={styles.logo}
              width={32}
              height={32}
            />
            <Link href="/home" className={styles.brandLink}>MOBZI</Link>
          </div>

          {/* @frontend/ Navegación principal - Desktop */}
          <div className={styles.links}>
            {isAuthenticated && (
              <>
                <Link className={styles.link} href="/home">
                  Inicio
                </Link>
                <Link className={styles.link} href="/routes">
                  Mis rutas
                </Link>
                <Link className={styles.link} href="/profile">
                  Perfil
                </Link>
                {usuario?.tipoUsuario === 'admin' && (
                  <Link className={styles.link} href="/admin">
                    Administración
                  </Link>
                )}
              </>
            )}
          </div>

          {/* @frontend/ Acciones - Desktop */}
          <div className={styles.actions}>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className={styles.logoutButton}
            >
              <Image 
                src="/logout.png" 
                alt="Cerrar sesión" 
                className={styles.logoutIcon}
                width={24}
                height={24}
              />
            </button>
          </div>

          {/* @frontend/ Botón hamburguesa para móvil */}
          <button
            className={styles.mobileToggle}
            onClick={toggleMobileMenu}
            aria-label={isBurger ? "Abrir menú" : "Cerrar menú"}
          >
            {isBurger ? "☰" : "✕"}
          </button>
        </div>
      </nav>

      {/* @frontend/ Menú móvil desplegable */}
      <div
        className={`${styles.sidebarOverlay} ${
          mobileMenuOpen ? styles.sidebarOverlayOpen : ""
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={`${styles.sidebar} ${
        mobileMenuOpen ? styles.sidebarOpen : ""
      }`}>
        <div className={styles.inner}>

          <div className={styles.sidebarLinks}>
            {isAuthenticated ? (
              <>
                <Link
                  className={styles.link}
                  href="/home"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Inicio
                </Link>
                <Link
                  className={styles.link}
                  href="/routes"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mis rutas
                </Link>
                <Link
                  className={styles.link}
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Perfil
                </Link>
                {usuario?.tipoUsuario === 'admin' && (
                  <Link
                    className={styles.link}
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administración
                  </Link>
                )}
                <button
                  className={styles.iconButton}
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                className={styles.link}
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
