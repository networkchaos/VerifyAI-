<template>
  <main class="min-h-screen bg-background overflow-hidden relative">
    <!-- Animated gradient background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
      <div class="absolute top-20 left-20 w-96 h-96 bg-accent-1 rounded-full mix-blend-screen filter blur-3xl opacity-5" />
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5" />
    </div>

    <div class="relative z-10 py-8 px-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <!-- Back Button -->
          <div class="mb-4">
            <router-link
              to="/"
              class="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
              <span>Back to Home</span>
            </router-link>
          </div>
          
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
                <History class="w-6 h-6 text-background" />
              </div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-primary via-accent-1 to-accent-2 bg-clip-text text-transparent">
                Verification History
              </h1>
            </div>
            <div class="flex items-center gap-3">
              <router-link
                to="/register"
                class="px-4 py-2 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all duration-300 glow-cyan flex items-center gap-2"
              >
                <Plus class="w-4 h-4" />
                New Verification
              </router-link>
            </div>
          </div>
          <p class="text-foreground/60">View all your verification tests and their results</p>
        </div>

        <!-- Stats Cards -->
        <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="glass rounded-xl p-4 border border-color-border/30">
            <p class="text-sm text-foreground/60 mb-1">Total Tests</p>
            <p class="text-2xl font-bold text-foreground">{{ stats.total }}</p>
          </div>
          <div class="glass rounded-xl p-4 border border-color-success/30 bg-color-success/5">
            <p class="text-sm text-foreground/60 mb-1">Approved</p>
            <p class="text-2xl font-bold text-color-success">{{ stats.verified }}</p>
          </div>
          <div class="glass rounded-xl p-4 border border-color-warning/30 bg-color-warning/5">
            <p class="text-sm text-foreground/60 mb-1">Failed</p>
            <p class="text-2xl font-bold text-color-warning">{{ stats.flagged + stats.rejected }}</p>
          </div>
          <div class="glass rounded-xl p-4 border border-color-border/30">
            <p class="text-sm text-foreground/60 mb-1">Pending</p>
            <p class="text-2xl font-bold text-foreground">{{ stats.pending }}</p>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            @click="filterStatus = null"
            :class="`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === null
                ? 'bg-gradient-to-r from-primary to-accent-1 text-background glow-cyan'
                : 'bg-surface-light/50 text-foreground/70 hover:bg-surface-light/70'
            }`"
          >
            All
          </button>
          <button
            @click="filterStatus = 'verified'"
            :class="`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'verified'
                ? 'bg-color-success text-background'
                : 'bg-surface-light/50 text-foreground/70 hover:bg-surface-light/70'
            }`"
          >
            Approved
          </button>
          <button
            @click="filterStatus = 'flagged'"
            :class="`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === 'flagged'
                ? 'bg-color-warning text-background'
                : 'bg-surface-light/50 text-foreground/70 hover:bg-surface-light/70'
            }`"
          >
            Failed
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <Loader2 class="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-foreground/60">Loading verification history...</p>
        </div>

        <!-- Verifications List -->
        <div v-else-if="verifications.length > 0" class="space-y-4">
          <div
            v-for="verification in verifications"
            :key="verification.id"
            @click="openDetails(verification.id)"
            :class="`glass rounded-xl p-6 border-2 transition-all hover:shadow-lg cursor-pointer ${
              verification.isApproved
                ? 'border-color-success/30 bg-color-success/5'
                : 'border-color-warning/30 bg-color-warning/5'
            }`"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  :class="`w-10 h-10 rounded-lg flex items-center justify-center ${
                    verification.isApproved
                      ? 'bg-color-success/20'
                      : 'bg-color-warning/20'
                  }`"
                >
                  <CheckCircle
                    v-if="verification.isApproved"
                    class="w-6 h-6 text-color-success"
                  />
                  <AlertCircle
                    v-else
                    class="w-6 h-6 text-color-warning"
                  />
                </div>
                <div>
                  <h3 class="font-semibold text-foreground text-lg">
                    {{ verification.name }}
                  </h3>
                  <p class="text-sm text-foreground/60">
                    ID: {{ verification.idNumber }} • {{ formatDate(verification.createdAt) }}
                  </p>
                </div>
              </div>
              <div
                :class="`px-3 py-1 rounded-lg text-sm font-semibold ${
                  verification.isApproved
                    ? 'bg-color-success/20 text-color-success'
                    : 'bg-color-warning/20 text-color-warning'
                }`"
              >
                {{ verification.isApproved ? 'APPROVED' : 'FAILED' }}
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p class="text-xs text-foreground/60 mb-1">Phone</p>
                <p class="text-sm font-medium text-foreground">{{ verification.phone }}</p>
              </div>
              <div>
                <p class="text-xs text-foreground/60 mb-1">Date of Birth</p>
                <p class="text-sm font-medium text-foreground">{{ verification.dateOfBirth || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-foreground/60 mb-1">Face Similarity</p>
                <p class="text-sm font-medium text-foreground">
                  {{ verification.faceSimilarity ? (verification.faceSimilarity * 100).toFixed(1) + '%' : 'N/A' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-foreground/60 mb-1">Verification ID</p>
                <p class="text-xs font-mono text-primary">{{ verification.id.substring(0, 8) }}...</p>
              </div>
            </div>

            <!-- Validation Errors -->
            <div
              v-if="verification.validationErrors && verification.validationErrors.length > 0"
              class="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p class="text-xs font-semibold text-red-500 mb-2">Validation Errors:</p>
              <ul class="space-y-1">
                <li
                  v-for="(error, idx) in verification.validationErrors"
                  :key="idx"
                  class="text-xs text-red-400 flex items-start gap-2"
                >
                  <AlertCircle class="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>

            <!-- Flagged Reason -->
            <div
              v-if="verification.flaggedReason && !verification.isApproved"
              class="mt-4 p-3 bg-color-warning/10 border border-color-warning/30 rounded-lg"
            >
              <p class="text-xs font-semibold text-color-warning mb-1">Reason:</p>
              <p class="text-xs text-color-warning">{{ getFlaggedReasonText(verification.flaggedReason) }}</p>
            </div>
            
            <!-- Click to view details -->
            <div class="mt-4 pt-4 border-t border-color-border/20">
              <p class="text-xs text-foreground/60 flex items-center gap-2">
                <Eye class="w-4 h-4" />
                Click to view full details
              </p>
            </div>
          </div>
        </div>
        
        <!-- Detail Modal -->
        <div
          v-if="selectedVerification"
          class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          @click.self="closeDetails"
        >
          <div class="bg-card rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <div class="flex items-center gap-3">
                <div
                  :class="`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedVerification.isApproved
                      ? 'bg-color-success/20'
                      : 'bg-color-warning/20'
                  }`"
                >
                  <CheckCircle
                    v-if="selectedVerification.isApproved"
                    class="w-6 h-6 text-color-success"
                  />
                  <AlertCircle
                    v-else
                    class="w-6 h-6 text-color-warning"
                  />
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-foreground">{{ selectedVerification.name }}</h2>
                  <p class="text-sm text-foreground/60">Verification Details</p>
                </div>
              </div>
              <button
                @click="closeDetails"
                class="text-foreground/60 hover:text-foreground transition-colors"
              >
                <X class="w-6 h-6" />
              </button>
            </div>
            
            <!-- Modal Content -->
            <div class="p-6 space-y-6">
              <!-- Status Badge -->
              <div
                :class="`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  selectedVerification.isApproved
                    ? 'bg-color-success/20 text-color-success'
                    : 'bg-color-warning/20 text-color-warning'
                }`"
              >
                {{ selectedVerification.isApproved ? '✅ APPROVED' : '❌ FAILED' }}
              </div>
              
              <!-- Images -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div v-if="selectedVerification.idImageUrl" class="space-y-2">
                  <p class="text-sm font-semibold text-foreground">ID Front</p>
                  <img
                    :src="`http://localhost:5000${selectedVerification.idImageUrl}`"
                    alt="ID Front"
                    class="w-full rounded-lg border border-color-border/30"
                  />
                </div>
                <div v-if="selectedVerification.idBackImageUrl" class="space-y-2">
                  <p class="text-sm font-semibold text-foreground">ID Back</p>
                  <img
                    :src="`http://localhost:5000${selectedVerification.idBackImageUrl}`"
                    alt="ID Back"
                    class="w-full rounded-lg border border-color-border/30"
                  />
                </div>
                <div v-if="selectedVerification.selfieImageUrl" class="space-y-2">
                  <p class="text-sm font-semibold text-foreground">Selfie</p>
                  <img
                    :src="`http://localhost:5000${selectedVerification.selfieImageUrl}`"
                    alt="Selfie"
                    class="w-full rounded-lg border border-color-border/30"
                  />
                </div>
              </div>
              
              <!-- Personal Details -->
              <div class="glass rounded-xl p-6 border border-color-border/30">
                <h3 class="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Full Name</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.name }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">National ID</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.idNumber }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Date of Birth</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.dateOfBirth || 'N/A' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Phone Number</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.phone }}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-sm text-foreground/60 mb-1">Address</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.address }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Verification Results -->
              <div class="glass rounded-xl p-6 border border-color-border/30">
                <h3 class="text-lg font-semibold text-foreground mb-4">Verification Results</h3>
                <div class="space-y-4">
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Face Similarity Score</p>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-surface-light/50 rounded-full h-3 overflow-hidden">
                        <div
                          :class="`h-full transition-all ${
                            selectedVerification.faceSimilarity >= 0.6
                              ? 'bg-color-success'
                              : 'bg-color-warning'
                          }`"
                          :style="`width: ${(selectedVerification.faceSimilarity || 0) * 100}%`"
                        />
                      </div>
                      <span class="font-semibold text-foreground">
                        {{ selectedVerification.faceSimilarity ? (selectedVerification.faceSimilarity * 100).toFixed(1) + '%' : 'N/A' }}
                      </span>
                    </div>
                    <p class="text-xs text-foreground/60 mt-1">
                      {{ selectedVerification.faceSimilarity >= 0.6 ? '✅ Passed (≥60%)' : '❌ Failed (<60%)' }}
                    </p>
                  </div>
                  
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Verification Status</p>
                    <p class="font-semibold" :class="selectedVerification.isApproved ? 'text-color-success' : 'text-color-warning'">
                      {{ selectedVerification.status.toUpperCase() }}
                    </p>
                  </div>
                  
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Verification ID</p>
                    <p class="font-mono text-primary text-sm">{{ selectedVerification.id }}</p>
                  </div>
                  
                  <div>
                    <p class="text-sm text-foreground/60 mb-1">Date & Time</p>
                    <p class="text-foreground">{{ formatDate(selectedVerification.createdAt) }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Success Reasons (if approved) -->
              <div
                v-if="selectedVerification.isApproved"
                class="glass rounded-xl p-6 border-2 border-color-success/30 bg-color-success/5"
              >
                <h3 class="text-lg font-semibold text-color-success mb-4 flex items-center gap-2">
                  <CheckCircle class="w-5 h-5" />
                  Why It Passed
                </h3>
                <ul class="space-y-2">
                  <li class="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle class="w-4 h-4 text-color-success mt-0.5 flex-shrink-0" />
                    <span>Face similarity: {{ (selectedVerification.faceSimilarity * 100).toFixed(1) }}% (≥60% required)</span>
                  </li>
                  <li class="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle class="w-4 h-4 text-color-success mt-0.5 flex-shrink-0" />
                    <span>ID details match entered information</span>
                  </li>
                  <li class="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle class="w-4 h-4 text-color-success mt-0.5 flex-shrink-0" />
                    <span>No duplicate records found</span>
                  </li>
                  <li class="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle class="w-4 h-4 text-color-success mt-0.5 flex-shrink-0" />
                    <span>All validation checks passed</span>
                  </li>
                </ul>
              </div>
              
              <!-- Failure Reasons (if failed) -->
              <div
                v-if="!selectedVerification.isApproved"
                class="glass rounded-xl p-6 border-2 border-color-warning/30 bg-color-warning/5"
              >
                <h3 class="text-lg font-semibold text-color-warning mb-4 flex items-center gap-2">
                  <AlertCircle class="w-5 h-5" />
                  Why It Failed
                </h3>
                
                <div v-if="selectedVerification.flaggedReason" class="mb-4">
                  <p class="text-sm font-semibold text-color-warning mb-2">Primary Reason:</p>
                  <p class="text-sm text-color-warning">{{ getFlaggedReasonText(selectedVerification.flaggedReason) }}</p>
                </div>
                
                <div v-if="selectedVerification.validationErrors && selectedVerification.validationErrors.length > 0">
                  <p class="text-sm font-semibold text-color-warning mb-2">Validation Errors:</p>
                  <ul class="space-y-2">
                    <li
                      v-for="(error, idx) in selectedVerification.validationErrors"
                      :key="idx"
                      class="flex items-start gap-2 text-sm text-color-warning"
                    >
                      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{{ error }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- OCR Extracted Data -->
              <div v-if="selectedVerification.ocrData" class="glass rounded-xl p-6 border border-color-border/30">
                <h3 class="text-lg font-semibold text-foreground mb-4">OCR Extracted Data</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div v-if="selectedVerification.ocrData.fullName">
                    <p class="text-foreground/60 mb-1">Extracted Name</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.ocrData.fullName }}</p>
                  </div>
                  <div v-if="selectedVerification.ocrData.idNumber">
                    <p class="text-foreground/60 mb-1">Extracted ID Number</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.ocrData.idNumber }}</p>
                  </div>
                  <div v-if="selectedVerification.ocrData.dateOfBirth">
                    <p class="text-foreground/60 mb-1">Extracted DOB</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.ocrData.dateOfBirth }}</p>
                  </div>
                  <div v-if="selectedVerification.ocrData.method">
                    <p class="text-foreground/60 mb-1">OCR Method</p>
                    <p class="font-medium text-foreground">{{ selectedVerification.ocrData.method }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass rounded-2xl p-12 text-center border border-color-border/30">
          <History class="h-16 w-16 text-foreground/30 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-foreground mb-2">No Verifications Yet</h3>
          <p class="text-foreground/60 mb-6">Start by verifying your first ID</p>
          <router-link
            to="/register"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all duration-300 glow-cyan"
          >
            <Plus class="w-4 h-4" />
            Start Verification
          </router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { History, CheckCircle, AlertCircle, Loader2, Plus, ArrowLeft, Eye, X } from 'lucide-vue-next'

const router = useRouter()
const verifications = ref([])
const stats = ref(null)
const loading = ref(true)
const filterStatus = ref(null)
const selectedVerification = ref(null)
const loadingDetails = ref(false)

const loadVerifications = async () => {
  try {
    loading.value = true
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const [verificationsRes, statsRes] = await Promise.all([
      axios.get('/api/verifications', { params }),
      axios.get('/api/verifications/stats'),
    ])
    
    verifications.value = verificationsRes.data.verifications || []
    stats.value = statsRes.data.stats || null
  } catch (error) {
    console.error('Error loading verifications:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getFlaggedReasonText = (reason) => {
  const reasons = {
    'duplicate_id_number': 'Duplicate ID number',
    'duplicate_phone': 'Duplicate phone number',
    'face_mismatch': 'Face similarity too low - selfie does not match ID photo',
    'id_mismatch': 'ID number mismatch',
    'id_details_mismatch': 'ID details do not match entered information',
    'id_number_mismatch': 'ID number does not match',
  }
  return reasons[reason] || reason || 'Verification failed'
}

const openDetails = async (id) => {
  try {
    loadingDetails.value = true
    const response = await axios.get(`/api/verifications/${id}`)
    if (response.data.status === 'success') {
      selectedVerification.value = response.data.verification
    }
  } catch (error) {
    console.error('Error loading verification details:', error)
  } finally {
    loadingDetails.value = false
  }
}

const closeDetails = () => {
  selectedVerification.value = null
}

watch(filterStatus, () => {
  loadVerifications()
})

onMounted(() => {
  loadVerifications()
})
</script>

