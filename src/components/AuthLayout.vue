<template>
  <main class="auth-layout">
    <section class="auth-branding">
      <div class="brand">
        <svg viewBox="0 0 40 36" aria-hidden="true">
          <path d="M2 12 20 3l18 9-18 9L2 12Z" fill="currentColor" />
          <path d="M9 18v9l11 6 11-6v-9l-11 6-11-6Z" fill="currentColor" />
          <path d="M4 15v11" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          <circle cx="20" cy="11" r="2" fill="white" />
        </svg>

        <span>Tutor<span class="brand-accent">Lah</span></span>
      </div>

      <slot name="branding"></slot>
    </section>

    <section class="auth-content">
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

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  color: var(--color-text, #1f2a30);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.8px;
   margin-bottom: 30px;
}

.brand svg {
  width: 50px;
  height: 45px;
  color: var(--color-primary, #0f6b4f);
  flex-shrink: 0;
}

.brand-accent {
  color: var(--color-primary, #0f6b4f);
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
</style>