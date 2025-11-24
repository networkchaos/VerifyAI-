<template>
  <nav class="w-full border-b border-color-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Logo/Brand -->
        <router-link
          to="/"
          class="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
            <Zap class="w-4 h-4 text-background" />
          </div>
          <span class="font-bold text-lg bg-gradient-to-r from-primary to-accent-1 bg-clip-text text-transparent">
            VerifyAI
          </span>
        </router-link>

        <!-- Navigation Links -->
        <div class="flex items-center gap-4">
          <router-link
            to="/"
            class="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            active-class="text-primary"
          >
            Home
          </router-link>
          <router-link
            to="/register"
            class="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            active-class="text-primary"
          >
            Verify
          </router-link>
          <router-link
            to="/history"
            class="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            active-class="text-primary"
          >
            History
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Zap } from 'lucide-vue-next'
</script>

