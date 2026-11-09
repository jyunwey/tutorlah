<template>
  <main class="auth-layout">
    <section class="auth-branding">
      <div class="auth-logo">
        <img src="/logo-1-book.svg" alt="TutorLah logo" />
      </div>

      <slot name="branding"></slot>
    </section>

    <section
      class="auth-content">
      <slot></slot>
    </section>
  </main>
</template>


<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 120px;

  min-height: 100vh;
  width: 100%;
  padding: 48px 5%;

  background-image: url('/auth-mint-background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  box-sizing: border-box;

  position: relative;
  overflow: hidden;
}


/* LEFT SIDE */
.auth-branding {
  flex: 1;
  max-width: 380px;
}

.auth-logo img {
  width: 290px;
  height: auto;
  display: block;
  margin-bottom: 20px;
}

.auth-branding :deep(h2) {
  font-size: 45px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1px;
  color:#0F1B4C;
  margin: 0 0 12px;
}

.auth-branding :deep(p) {
  font-size: 17px;
  line-height: 1.5;
  color: #52658a;
  margin-bottom: 30px;
}

.auth-branding :deep(.feature) {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

.auth-branding :deep(.feature-icon) {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.auth-branding :deep(.feature-text) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.auth-branding :deep(.feature-text h4) {
  font-size: 17px;
  font-weight: 700;
  color: #0F1B4C;
  margin: 0;
}

.auth-branding :deep(.feature-text p) {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
  color: #52658a;
  margin: 0;
}

/* RIGHT SIDE */
.auth-content {
  flex: 1.4;
  max-width: 600px;
  padding: 35px 45px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.auth-content :deep(.auth-switch) {
  margin: 0 0 0;
  text-align: center;
  font-size: 13px;
  color: #52658a;
}

.auth-content :deep(.auth-switch a) {
  color: #00875a;
  font-weight: 700;
  text-decoration: none;
}

.auth-content :deep(.auth-switch a:hover) {
  text-decoration: underline;
}

@media (max-width: 760px) {
  .auth-layout {
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 24px;
    min-height: 100dvh;
    padding: 24px 16px;
    overflow: auto;
  }

  .auth-branding,
  .auth-content {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .auth-logo img {
    width: min(220px, 70vw);
  }

  .auth-branding :deep(h2) {
    font-size: 2rem;
  }

  .auth-branding :deep(.feature) {
    margin-bottom: 14px;
  }

  .auth-content {
    padding: 28px 20px;
  }
}
</style>
