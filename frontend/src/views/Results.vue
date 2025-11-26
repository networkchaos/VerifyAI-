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

    <div v-if="loading" class="relative z-10 min-h-screen flex items-center justify-center">
      <div class="text-center">
        <Zap class="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <p class="text-foreground/60">Loading results...</p>
      </div>
    </div>

    <div v-else-if="!result" class="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div class="glass glow-cyan rounded-2xl p-8 border-color-border/30 text-center max-w-md">
        <AlertCircle class="h-12 w-12 text-color-warning mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-foreground mb-2">No Results Found</h1>
        <p class="text-foreground/60 mb-6">Please complete the registration form first.</p>
        <router-link
          to="/register"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all duration-300 glow-cyan"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to Registration
        </router-link>
      </div>
    </div>

    <div v-else class="relative z-10 py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Back Button -->
        <div class="mb-6">
          <router-link
            to="/register"
            class="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
            <span>Back to Registration</span>
          </router-link>
        </div>
        
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
              <Zap class="w-6 h-6 text-background" />
            </div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-primary via-accent-1 to-accent-2 bg-clip-text text-transparent">
              Verification Results
            </h1>
          </div>
        </div>

        <!-- Status Card -->
        <div
          :class="`glass rounded-2xl p-8 mb-8 border-2 transition-all ${
            isVerified
              ? 'border-color-success/30 glow-cyan bg-color-success/5'
              : 'border-color-warning/30 glow-magenta bg-color-warning/5'
          }`"
        >
          <div class="flex flex-col items-center text-center mb-8">
            <div
              :class="`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                isVerified ? 'bg-color-success/20' : 'bg-color-warning/20'
              }`"
            >
              <CheckCircle v-if="isVerified" class="h-12 w-12 text-color-success animate-pulse" />
              <AlertCircle v-else class="h-12 w-12 text-color-warning animate-pulse" />
            </div>

            <h2 :class="`text-3xl font-bold mb-2 ${isVerified ? 'text-color-success' : 'text-color-warning'}`">
              {{ isVerified ? 'Verification Successful' : 'Under Review' }}
            </h2>

            <p class="text-foreground/70 text-lg mb-4">{{ result.message }}</p>

            <div class="flex items-center justify-center gap-3 bg-surface-light/40 px-6 py-3 rounded-lg border border-color-border/20">
              <span class="text-foreground/60">Voter ID:</span>
              <span class="font-mono text-lg font-semibold text-primary">{{ result.voterId }}</span>
            </div>
          </div>
        </div>

        <!-- Status Details -->
        <div class="glass rounded-2xl p-8 border-color-border/30 mb-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-1 h-6 bg-gradient-to-b from-primary to-accent-1" />
            <h3 class="text-xl font-semibold text-foreground">Registration Details</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="border-l-2 border-primary/30 pl-4">
              <p class="text-sm text-foreground/60 mb-1">Full Name</p>
              <p class="text-foreground font-medium">{{ result.data.fullName }}</p>
            </div>
            <div class="border-l-2 border-primary/30 pl-4">
              <p class="text-sm text-foreground/60 mb-1">National ID</p>
              <p class="text-foreground font-medium">{{ result.data.nationalId }}</p>
            </div>
            <div class="border-l-2 border-primary/30 pl-4">
              <p class="text-sm text-foreground/60 mb-1">Date of Birth</p>
              <p class="text-foreground font-medium">{{ result.data.dateOfBirth }}</p>
            </div>
            <div class="border-l-2 border-primary/30 pl-4">
              <p class="text-sm text-foreground/60 mb-1">Phone Number</p>
              <p class="text-foreground font-medium">{{ result.data.phoneNumber }}</p>
            </div>
            <div class="md:col-span-2 border-l-2 border-primary/30 pl-4">
              <p class="text-sm text-foreground/60 mb-1">Address</p>
              <p class="text-foreground font-medium">{{ result.data.address }}</p>
            </div>
          </div>
        </div>

        <!-- Extracted Data from ID Card -->
        <div
          v-if="result.extractedData"
          class="glass rounded-2xl p-8 border-color-border/30 mb-8"
        >
          <div class="flex items-center gap-3 mb-6">
            <FileText class="h-5 w-5 text-accent-2" />
            <div class="w-1 h-6 bg-gradient-to-b from-accent-2 to-accent-3" />
            <h3 class="text-xl font-semibold text-foreground">Extracted Data from ID Card</h3>
            <span
              v-if="result.extractedData.method"
              class="text-xs px-2 py-1 bg-surface-light/40 rounded-lg text-foreground/60 ml-auto"
            >
              Method: {{ result.extractedData.method }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-if="result.extractedData.fullName"
              class="border-l-2 pl-4"
              :class="
                result.extractedData.fullName !== result.data.fullName
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-color-success/50 bg-color-success/5'
              "
            >
              <p class="text-sm text-foreground/60 mb-1">Full Name</p>
              <p class="text-foreground font-medium">{{ result.extractedData.fullName }}</p>
              <p
                v-if="result.extractedData.fullName !== result.data.fullName"
                class="text-xs text-red-400 mt-1"
              >
                ⚠️ Does not match entered name
              </p>
              <p
                v-else
                class="text-xs text-color-success mt-1"
              >
                ✅ Matches entered name
              </p>
            </div>
            <div
              v-if="result.extractedData.idNumber"
              class="border-l-2 pl-4"
              :class="
                result.extractedData.idNumber !== result.data.nationalId
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-color-success/50 bg-color-success/5'
              "
            >
              <p class="text-sm text-foreground/60 mb-1">ID Number</p>
              <p class="text-foreground font-medium font-mono">{{ result.extractedData.idNumber }}</p>
              <p
                v-if="result.extractedData.idNumber !== result.data.nationalId"
                class="text-xs text-red-400 mt-1"
              >
                ⚠️ Does not match entered ID
              </p>
              <p
                v-else
                class="text-xs text-color-success mt-1"
              >
                ✅ Matches entered ID
              </p>
            </div>
            <div
              v-if="result.extractedData.dateOfBirth"
              class="border-l-2 pl-4"
              :class="
                result.extractedData.dateOfBirth !== result.data.dateOfBirth
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-color-success/50 bg-color-success/5'
              "
            >
              <p class="text-sm text-foreground/60 mb-1">Date of Birth</p>
              <p class="text-foreground font-medium">{{ result.extractedData.dateOfBirth }}</p>
              <p
                v-if="result.extractedData.dateOfBirth !== result.data.dateOfBirth"
                class="text-xs text-red-400 mt-1"
              >
                ⚠️ Does not match entered DOB
              </p>
              <p
                v-else
                class="text-xs text-color-success mt-1"
              >
                ✅ Matches entered DOB
              </p>
            </div>
            <div
              v-if="result.extractedData.sex"
              class="border-l-2 border-primary/30 pl-4"
            >
              <p class="text-sm text-foreground/60 mb-1">Sex</p>
              <p class="text-foreground font-medium">{{ result.extractedData.sex }}</p>
            </div>
            <div
              v-if="result.extractedData.districtOfBirth"
              class="border-l-2 border-primary/30 pl-4"
            >
              <p class="text-sm text-foreground/60 mb-1">District of Birth</p>
              <p class="text-foreground font-medium">{{ result.extractedData.districtOfBirth }}</p>
            </div>
            <div
              v-if="result.extractedData.placeOfIssue"
              class="border-l-2 border-primary/30 pl-4"
            >
              <p class="text-sm text-foreground/60 mb-1">Place of Issue</p>
              <p class="text-foreground font-medium">{{ result.extractedData.placeOfIssue }}</p>
            </div>
            <div
              v-if="result.extractedData.dateOfIssue"
              class="border-l-2 border-primary/30 pl-4"
            >
              <p class="text-sm text-foreground/60 mb-1">Date of Issue</p>
              <p class="text-foreground font-medium">{{ result.extractedData.dateOfIssue }}</p>
            </div>
          </div>
        </div>

        <!-- Status-specific message -->
        <div
          v-if="!isVerified"
          class="glass rounded-2xl p-8 border-color-warning/30 border-2 glow-magenta mb-8 bg-color-warning/5"
        >
          <div class="flex gap-4">
            <AlertCircle class="h-6 w-6 text-color-warning flex-shrink-0 mt-1" />
            <div>
              <h3 class="font-semibold text-foreground mb-2">Review Status</h3>
              <p class="text-foreground/70">
                Your registration has been flagged for manual review. Please keep your Voter ID ({{ result.voterId }})
                safe. You will be notified via email or phone once the review is complete. This typically takes 2-3
                business days.
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="isVerified"
          class="glass rounded-2xl p-8 border-color-success/30 border-2 glow-cyan mb-8 bg-color-success/5"
        >
          <div class="flex gap-4">
            <CheckCircle class="h-6 w-6 text-color-success flex-shrink-0 mt-1" />
            <div>
              <h3 class="font-semibold text-foreground mb-2">You're All Set</h3>
              <p class="text-foreground/70">
                Congratulations! Your identity has been verified and approved. Your verification is complete. Your Verification ID is {{ result.voterId }}.
              </p>
            </div>
          </div>
        </div>

        <!-- Validation Errors Display -->
        <div
          v-if="result.validationErrors && result.validationErrors.length > 0"
          class="glass rounded-2xl p-6 border-2 border-red-500/30 glow-magenta mb-8 bg-red-500/5"
        >
          <div class="flex gap-4 mb-4">
            <AlertCircle class="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div class="flex-1">
              <h3 class="font-semibold text-foreground mb-2 text-red-500">Verification Failed - Issues Found:</h3>
              <ul class="space-y-2">
                <li
                  v-for="(error, idx) in result.validationErrors"
                  :key="idx"
                  class="text-sm text-red-400 flex items-start gap-2"
                >
                  <span class="text-red-500">•</span>
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Face Similarity Info -->
        <div
          v-if="result.similarity !== undefined"
          class="glass rounded-xl p-4 border border-color-border/30 mb-8"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-foreground/60 mb-1">Face Similarity Score</p>
              <p class="text-lg font-semibold text-foreground">
                {{ (result.similarity * 100).toFixed(1) }}%
                <span
                  :class="`text-sm ml-2 ${
                    result.similarity >= 0.6 ? 'text-color-success' : 'text-color-warning'
                  }`"
                >
                  ({{ result.similarity >= 0.6 ? 'Match' : 'Mismatch' }})
                </span>
              </p>
            </div>
            <div
              :class="`w-16 h-16 rounded-full flex items-center justify-center ${
                result.similarity >= 0.6 ? 'bg-color-success/20' : 'bg-color-warning/20'
              }`"
            >
              <CheckCircle
                v-if="result.similarity >= 0.6"
                class="w-8 h-8 text-color-success"
              />
              <AlertCircle
                v-else
                class="w-8 h-8 text-color-warning"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4">
          <router-link
            to="/register"
            class="flex-1 px-6 py-4 bg-surface-light/40 hover:bg-surface-light/60 text-foreground font-semibold rounded-lg transition-all duration-300 border border-color-border/30 text-center flex items-center justify-center gap-2"
          >
            <Plus class="h-5 w-5" />
            Test Another ID
          </router-link>
          <router-link
            to="/history"
            class="flex-1 px-6 py-4 bg-gradient-to-r from-accent-2 to-accent-3 hover:from-accent-2 hover:to-accent-3 text-background font-semibold rounded-lg transition-all duration-300 glow-purple text-center flex items-center justify-center gap-2"
          >
            <History class="h-5 w-5" />
            View All Tests
          </router-link>
          <router-link
            to="/"
            class="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all duration-300 glow-cyan text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft class="h-5 w-5" />
            Back to Home
          </router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CheckCircle, AlertCircle, Zap, ArrowLeft, Plus, History, FileText } from 'lucide-vue-next'

const result = ref(null)
const loading = ref(true)

const isVerified = computed(() => result.value?.status === 'verified')

onMounted(() => {
  const storedResult = localStorage.getItem('registrationResult')
  if (storedResult) {
    result.value = JSON.parse(storedResult)
  }
  loading.value = false
})
</script>
