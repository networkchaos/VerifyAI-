<template>
  <main class="min-h-screen bg-background overflow-hidden relative">
    <!-- Animated gradient background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
      <div class="absolute top-20 left-20 w-96 h-96 bg-accent-1 rounded-full mix-blend-screen filter blur-3xl opacity-5" />
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5" />
      <div class="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-2 rounded-full mix-blend-screen filter blur-3xl opacity-5" />
    </div>

    <!-- Grid overlay -->
    <div class="fixed inset-0 -z-10 opacity-5 pointer-events-none">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    <div class="relative z-10 py-16 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
              <Zap class="w-6 h-6 text-background" />
            </div>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent-1 to-accent-2 bg-clip-text text-transparent mb-4">
            VerifyAI
          </h1>
          <p class="text-xl text-foreground/60 max-w-2xl mx-auto">
            Advanced identity verification powered by cutting-edge biometric technology
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="glass glow-cyan rounded-xl p-6 border border-color-border/30 hover:border-primary/50 transition-all duration-300 group">
            <div class="w-10 h-10 rounded-lg bg-accent-1/20 flex items-center justify-center mb-4 group-hover:bg-accent-1/30 transition-colors">
              <Shield class="w-5 h-5 text-accent-1" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">Secure Identity Verification</h3>
            <p class="text-foreground/60 text-sm">
              Advanced biometric scanning and AI-powered identity verification to prevent fraud and ensure authentic
              voter registration.
            </p>
          </div>

          <div class="glass glow-cyan rounded-xl p-6 border border-color-border/30 hover:border-primary/50 transition-all duration-300 group">
            <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
              <Lock class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">Privacy Protected</h3>
            <p class="text-foreground/60 text-sm">
              Your personal data is encrypted and protected with military-grade security protocols. Your privacy is
              our priority.
            </p>
          </div>

          <div class="glass glow-cyan rounded-xl p-6 border border-color-border/30 hover:border-primary/50 transition-all duration-300 group">
            <div class="w-10 h-10 rounded-lg bg-accent-2/20 flex items-center justify-center mb-4 group-hover:bg-accent-2/30 transition-colors">
              <Gauge class="w-5 h-5 text-accent-2" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">Real-Time Processing</h3>
            <p class="text-foreground/60 text-sm">
              Instant verification with intelligent risk assessment. Get immediate feedback on your registration
              status.
            </p>
          </div>

          <div class="glass glow-cyan rounded-xl p-6 border border-color-border/30 hover:border-primary/50 transition-all duration-300 group">
            <div class="w-10 h-10 rounded-lg bg-accent-1/20 flex items-center justify-center mb-4 group-hover:bg-accent-1/30 transition-colors">
              <Zap class="w-5 h-5 text-accent-1" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">Next-Gen Technology</h3>
            <p class="text-foreground/60 text-sm">
              Built with the latest AI and machine learning models to deliver accuracy and reliability for democratic
              processes.
            </p>
          </div>
        </div>

        <!-- How it Works -->
        <div class="glass glow-cyan rounded-xl p-8 border border-color-border/30 mb-12">
          <h2 class="text-2xl font-bold text-foreground mb-6">How It Works</h2>
          <div class="space-y-4">
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center text-background font-semibold">
                  1
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-foreground mb-1">Enter Your Information</h3>
                <p class="text-foreground/60 text-sm">
                  Provide your personal details including full name, national ID, and contact information.
                </p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-1 to-accent-2 flex items-center justify-center text-background font-semibold">
                  2
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-foreground mb-1">Upload National ID</h3>
                <p class="text-foreground/60 text-sm">
                  Scan or upload a clear image of your national identification document for verification.
                </p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-2 to-accent-3 flex items-center justify-center text-background font-semibold">
                  3
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-foreground mb-1">Biometric Capture</h3>
                <p class="text-foreground/60 text-sm">
                  Use your device camera to capture a live selfie for facial recognition and identity matching.
                </p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent-3 to-primary flex items-center justify-center text-background font-semibold">
                  4
                </div>
              </div>
              <div>
                <h3 class="font-semibold text-foreground mb-1">Instant Verification</h3>
                <p class="text-foreground/60 text-sm">
                  Our AI system analyzes your documents and biometrics to verify your identity in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="text-center">
          <p class="text-foreground/60 mb-6">Ready to verify your identity?</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <router-link
              to="/register"
              class="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold py-4 px-8 rounded-lg transition-all duration-300 glow-cyan hover:glow-cyan group"
            >
              <span>Begin Verification</span>
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </router-link>
            <router-link
              to="/history"
              class="inline-flex items-center gap-3 bg-surface-light/40 hover:bg-surface-light/60 text-foreground font-semibold py-4 px-8 rounded-lg transition-all duration-300 border border-color-border/30"
            >
              <History class="w-5 h-5" />
              <span>View History</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { Zap, Shield, Lock, Gauge, ArrowRight, History } from 'lucide-vue-next'
</script>
