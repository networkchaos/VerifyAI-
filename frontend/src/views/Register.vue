<template>
  <main class="min-h-screen bg-background overflow-hidden relative">
    <!-- Animated gradient background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
      <!-- Glow orbs -->
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

    <div class="relative z-10 py-8 px-4">
      <!-- Navigation Header -->
      <div class="max-w-4xl mx-auto mb-6">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>Back to Home</span>
        </router-link>
      </div>
      <VoterRegistration />
    </div>
  </main>
</template>

<script setup>
import VoterRegistration from '@/components/VoterRegistration.vue'
import { ArrowLeft } from 'lucide-vue-next'
</script>
