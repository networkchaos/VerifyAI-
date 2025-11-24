<template>
  <div class="max-w-2xl mx-auto">
    <div class="glass glow-cyan rounded-2xl p-8 border-color-border/30">
      <div class="mb-8 border-b border-color-border/20 pb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
            <Zap class="w-4 h-4 text-background" />
          </div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-primary via-accent-1 to-accent-2 bg-clip-text text-transparent">
            VerifyAI
          </h1>
        </div>
        <p class="text-foreground/60 ml-11">Secure identity verification powered by advanced technology</p>
      </div>

      <!-- Notification Box -->
      <Transition name="notification">
        <div
          v-if="notification.show"
          :class="`mb-6 p-4 rounded-xl border flex gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-color-success/10 border-color-success/30 glow-cyan'
              : notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-color-warning/10 border-color-warning/30 glow-magenta'
          }`"
        >
          <CheckCircle v-if="notification.type === 'success'" class="h-5 w-5 text-color-success flex-shrink-0 mt-0.5" />
          <AlertCircle v-else class="h-5 w-5 flex-shrink-0 mt-0.5" :class="notification.type === 'error' ? 'text-red-500' : 'text-color-warning'" />
          <div class="flex-1">
            <p :class="notification.type === 'success' ? 'text-color-success' : notification.type === 'error' ? 'text-red-500' : 'text-color-warning'">
              <span class="font-semibold">{{ notification.title }}</span>
              <span v-if="notification.message"> {{ notification.message }}</span>
            </p>
          </div>
          <button
            @click="notification.show = false"
            class="text-foreground/50 hover:text-foreground transition-colors"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </Transition>

      <!-- Response Message -->
      <div
        v-if="response"
        :class="`mb-6 p-4 rounded-xl border flex gap-3 transition-all ${
          response.status === 'verified'
            ? 'bg-color-success/10 border-color-success/30 glow-cyan'
            : 'bg-color-warning/10 border-color-warning/30 glow-magenta'
        }`"
      >
        <CheckCircle v-if="response.status === 'verified'" class="h-5 w-5 text-color-success flex-shrink-0 mt-0.5" />
        <AlertCircle v-else class="h-5 w-5 text-color-warning flex-shrink-0 mt-0.5" />
        <div>
          <p v-if="response.status === 'verified'" class="text-color-success">
            <span class="font-semibold">Verification Complete!</span> Your registration has been verified and
            approved.
          </p>
          <p v-else-if="response.status === 'flagged'" class="text-color-warning">
            <span class="font-semibold">Review Required:</span> Reference ID:
            <span class="font-mono text-primary">{{ response.voterId }}</span>
          </p>
          <p v-else class="text-color-warning">{{ response.message }}</p>
          <!-- Show validation errors if present -->
          <div
            v-if="response.validationErrors && response.validationErrors.length > 0"
            class="mt-3 pt-3 border-t border-color-warning/20"
          >
            <p class="text-xs font-semibold text-color-warning mb-2">Issues Found:</p>
            <ul class="space-y-1">
              <li
                v-for="(error, idx) in response.validationErrors"
                :key="idx"
                class="text-xs text-color-warning flex items-start gap-2"
              >
                <AlertCircle class="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{{ error }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitForm" class="space-y-6">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-1 h-6 bg-gradient-to-b from-primary to-accent-1" />
            <h2 class="text-lg font-semibold text-foreground">Personal Information</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">Full Name *</label>
              <input
                v-model="fullName"
                type="text"
                placeholder="John Doe"
                :class="`w-full px-4 py-3 bg-surface-light/50 border rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.fullName ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-color-border/30 focus:ring-primary/50 focus:border-primary/50'
                }`"
              />
              <p v-if="errors.fullName" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle class="h-3 w-3" />
                {{ errors.fullName }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">National ID Number *</label>
              <input
                v-model="nationalId"
                type="text"
                placeholder="25051848"
                :class="`w-full px-4 py-3 bg-surface-light/50 border rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.nationalId ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-color-border/30 focus:ring-primary/50 focus:border-primary/50'
                }`"
              />
              <p v-if="errors.nationalId" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle class="h-3 w-3" />
                {{ errors.nationalId }}
              </p>
              <p v-else class="text-xs text-foreground/50 mt-1">Kenyan ID: 6-10 digits</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">Date of Birth *</label>
              <input
                v-model="dateOfBirth"
                type="date"
                :class="`w-full px-4 py-3 bg-surface-light/50 border rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.dateOfBirth ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-color-border/30 focus:ring-primary/50 focus:border-primary/50'
                }`"
              />
              <p v-if="errors.dateOfBirth" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle class="h-3 w-3" />
                {{ errors.dateOfBirth }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">Phone Number *</label>
              <input
                v-model="phoneNumber"
                type="tel"
                placeholder="+254 (7xx) xxxxxx"
                :class="`w-full px-4 py-3 bg-surface-light/50 border rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.phoneNumber ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-color-border/30 focus:ring-primary/50 focus:border-primary/50'
                }`"
              />
              <p v-if="errors.phoneNumber" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle class="h-3 w-3" />
                {{ errors.phoneNumber }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground/80 mb-2">Address *</label>
          <textarea
            v-model="address"
            placeholder="123 Main Street, City, State 12345"
            rows="2"
            :class="`w-full px-4 py-3 bg-surface-light/50 border rounded-lg text-foreground placeholder-foreground/30 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
              errors.address ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : 'border-color-border/30 focus:ring-primary/50 focus:border-primary/50'
            }`"
          />
          <p v-if="errors.address" class="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle class="h-3 w-3" />
            {{ errors.address }}
          </p>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-1 h-6 bg-gradient-to-b from-accent-1 to-accent-2" />
            <h2 class="text-lg font-semibold text-foreground">Identity Verification</h2>
          </div>

          <button
            type="button"
            @click="showIdTips = !showIdTips"
            class="mb-4 flex items-center gap-2 text-primary hover:text-accent-1 transition-colors text-sm"
          >
            <Info class="w-4 h-4" />
            {{ showIdTips ? 'Hide' : 'Show' }} Kenyan ID Guidelines
          </button>

          <div v-if="showIdTips" class="mb-4 p-4 bg-accent-1/10 border border-accent-1/30 rounded-lg text-sm text-foreground/80 space-y-2">
            <p class="font-semibold text-accent-1">Kenyan National ID Requirements:</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li>Upload clear photos of both front and back sides of your national ID card</li>
              <li>Ensure the photos show all text clearly and are well-lit</li>
              <li>The ID card should be clearly visible with all text readable</li>
              <li>Avoid glare and blurry images for best results</li>
              <li>Your information will be automatically extracted from the ID</li>
              <li>Both ID photos and selfie will be used for identity verification</li>
            </ul>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Front ID Upload -->
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">Front Side of ID *</label>
              <div
                @click="idFileRef?.click()"
                class="border-2 border-dashed border-color-border/40 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 bg-surface-light/20 hover:bg-surface-light/40 group"
              >
                <div class="flex justify-center mb-2">
                  <div class="p-2 bg-accent-1/10 rounded-lg group-hover:bg-accent-1/20 transition-colors">
                    <Upload class="h-6 w-6 text-primary group-hover:text-accent-1 transition-colors" />
                  </div>
                </div>
                <p class="text-foreground font-medium text-sm mb-1">Upload Front</p>
                <p class="text-xs text-foreground/50">PNG, JPG up to 10MB</p>
              </div>
              <input ref="idFileRef" type="file" accept="image/*" @change="handleIdFileChange" class="hidden" />
              <div v-if="idImage" class="mt-3 relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-primary to-accent-2 rounded-lg blur opacity-20 group-hover:opacity-40 transition" />
                <img
                  :src="idImage || '/placeholder.svg'"
                  alt="ID front preview"
                  class="relative max-h-40 rounded-lg border border-color-border/30 w-full object-cover"
                />
                <button
                  v-if="extractingData"
                  type="button"
                  class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
                >
                  <Loader2 class="h-6 w-6 text-white animate-spin" />
                </button>
                <button
                  v-else
                  type="button"
                  @click="openCropModal('front', idImage)"
                  class="absolute top-2 right-2 px-3 py-1.5 bg-primary/90 hover:bg-primary text-background text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                >
                  <Crop class="h-3 w-3" />
                  Crop
                </button>
              </div>
            </div>

            <!-- Back ID Upload -->
            <div>
              <label class="block text-sm font-medium text-foreground/80 mb-2">Back Side of ID *</label>
              <div
                @click="idBackFileRef?.click()"
                class="border-2 border-dashed border-color-border/40 hover:border-primary/50 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 bg-surface-light/20 hover:bg-surface-light/40 group"
              >
                <div class="flex justify-center mb-2">
                  <div class="p-2 bg-accent-2/10 rounded-lg group-hover:bg-accent-2/20 transition-colors">
                    <Upload class="h-6 w-6 text-accent-2 group-hover:text-accent-2 transition-colors" />
                  </div>
                </div>
                <p class="text-foreground font-medium text-sm mb-1">Upload Back</p>
                <p class="text-xs text-foreground/50">PNG, JPG up to 10MB</p>
              </div>
              <input ref="idBackFileRef" type="file" accept="image/*" @change="handleIdBackFileChange" class="hidden" />
              <div v-if="idBackImage" class="mt-3 relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-accent-2 to-accent-3 rounded-lg blur opacity-20 group-hover:opacity-40 transition" />
                <img
                  :src="idBackImage || '/placeholder.svg'"
                  alt="ID back preview"
                  class="relative max-h-40 rounded-lg border border-color-border/30 w-full object-cover"
                />
                <button
                  type="button"
                  @click="openCropModal('back', idBackImage)"
                  class="absolute top-2 right-2 px-3 py-1.5 bg-accent-2/90 hover:bg-accent-2 text-background text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                >
                  <Crop class="h-3 w-3" />
                  Crop
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-1 h-6 bg-gradient-to-b from-accent-2 to-accent-3" />
              <h2 class="text-lg font-semibold text-foreground">Biometric Capture</h2>
            </div>
            <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <label class="text-sm text-foreground/70">OCR Model:</label>
                <select
                  v-model="ocrModel"
                  class="px-3 py-1.5 bg-surface-light/50 border border-color-border/30 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option 
                    v-for="model in availableOcrModels" 
                    :key="model.id" 
                    :value="model.id"
                    :disabled="model.requiresApiKey && !model.isConfigured"
                  >
                    {{ model.name }}{{ model.requiresApiKey && !model.isConfigured ? ' (API key required)' : '' }}
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm text-foreground/70">Face Detection:</label>
                <select
                  v-model="faceModel"
                  class="px-3 py-1.5 bg-surface-light/50 border border-color-border/30 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option :value="null">Auto (Default)</option>
                  <option 
                    v-for="model in availableFaceModels" 
                    :key="model.id" 
                    :value="model.id"
                    :disabled="!model.isAvailable"
                  >
                    {{ model.name }}{{ !model.isAvailable ? ' (Not available)' : '' }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <button
            v-if="!cameraActive"
            type="button"
            @click="startCamera"
            class="w-full bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 glow-cyan hover:glow-cyan group"
          >
            <Camera class="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>Activate Camera</span>
          </button>
          <div v-else class="space-y-4">
            <div class="relative rounded-xl overflow-hidden border-2 border-primary/30 glow-cyan bg-black min-h-[400px] flex items-center justify-center scan-line">
              <video 
                ref="videoRef" 
                autoplay 
                playsinline 
                muted
                class="w-full h-full object-cover relative z-0"
                style="transform: scaleX(-1); min-height: 400px;"
                @loadedmetadata="() => console.log('Video metadata loaded')"
                @play="() => console.log('Video playing')"
                @error="(e) => console.error('Video error:', e)"
              />
              <div v-if="!videoRef || !videoRef.readyState || videoRef.readyState < 2" class="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                <div class="text-center text-white">
                  <Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p class="text-sm">Initializing camera...</p>
                </div>
              </div>
              <!-- Scanning Grid Overlay -->
              <div class="scan-grid absolute inset-0 z-10 pointer-events-none" />
              
              <!-- Scanning Corners -->
              <div class="scan-corner scan-corner-top-left" />
              <div class="scan-corner scan-corner-top-right" />
              <div class="scan-corner scan-corner-bottom-left" />
              <div class="scan-corner scan-corner-bottom-right" />
              
              <!-- Scanning Status Text -->
              <div class="absolute bottom-20 left-0 right-0 flex justify-center z-10 pointer-events-none">
                <div class="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30">
                  <p class="text-primary text-sm font-semibold flex items-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" />
                    Scanning for face...
                  </p>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                @click="captureSelfie"
                class="flex-1 bg-color-success hover:bg-green-600 text-background font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg"
              >
                <CheckCircle class="h-5 w-5" />
                Capture Selfie
              </button>
              <button
                type="button"
                @click="stopCamera"
                class="flex-1 bg-color-warning/20 hover:bg-color-warning/30 text-color-warning font-semibold py-3 rounded-lg transition-all duration-300 border border-color-warning/30"
              >
                Cancel
              </button>
            </div>
          </div>

          <div v-if="selfieImage" class="mt-4 relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-accent-2 to-accent-3 rounded-lg blur opacity-20 group-hover:opacity-40 transition" />
            <img
              :src="selfieImage || '/placeholder.svg'"
              alt="Selfie preview"
              class="relative max-h-48 rounded-lg border border-color-border/30 w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-lg" />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-accent-1 via-primary to-accent-1 hover:from-accent-1 hover:via-primary-dark hover:to-accent-1 disabled:from-foreground/20 disabled:via-foreground/20 disabled:to-foreground/20 text-background disabled:text-foreground/50 font-semibold py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 glow-purple hover:glow-purple mt-8"
        >
          <Loader2 v-if="loading" class="h-5 w-5 animate-spin" />
          <Zap v-else class="h-5 w-5" />
          <span>{{ loading ? 'Verifying Person...' : 'Verify Person' }}</span>
        </button>
      </form>

      <canvas ref="canvasRef" class="hidden" />
    </div>

    <!-- Image Crop Modal -->
    <Transition name="modal">
      <ImageCropper
        v-if="showCropModal"
        :image-src="cropImageSrc"
        @close="closeCropModal"
        @cropped="handleCropped"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, Zap, Info, X, Crop } from 'lucide-vue-next'
import ImageCropper from './ImageCropper.vue'

const router = useRouter()

const fullName = ref('')
const nationalId = ref('')
const dateOfBirth = ref('')
const phoneNumber = ref('')
const address = ref('')

const idImage = ref(null)
const idBackImage = ref(null)
const selfieImage = ref(null)
const showCropModal = ref(false)
const cropImageType = ref(null) // 'front' or 'back'
const cropImageSrc = ref(null)
const cropperRef = ref(null)

const cameraActive = ref(false)
const loading = ref(false)
const extractingData = ref(false)
const response = ref(null)
const showIdTips = ref(false)
const ocrModel = ref('tesseract')
const faceModel = ref(null)
const availableOcrModels = ref([
  { id: 'tesseract', name: 'Tesseract (Default)', description: 'Free, works offline' },
  { id: 'google-vision', name: 'Google Vision AI', description: 'High accuracy, requires API key' },
])
const availableFaceModels = ref([
  { id: 'yolov8-face', name: 'YOLOv8 Face (Default)', description: 'Ultra-fast, accurate', isAvailable: true },
])
const errors = ref({})
const notification = ref({
  show: false,
  type: 'error', // 'success', 'error', 'warning'
  title: '',
  message: '',
})

const videoRef = ref(null)
const canvasRef = ref(null)
const idFileRef = ref(null)
const idBackFileRef = ref(null)
const streamRef = ref(null)

const validateKenyanId = (id) => {
  const idRegex = /^[0-9]{6,10}$/
  return idRegex.test(id)
}

const showNotification = (type, title, message = '') => {
  notification.value = {
    show: true,
    type,
    title,
    message,
  }
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const startCamera = async () => {
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotification('error', 'Camera Not Supported', 'Please use a modern browser like Chrome, Firefox, or Edge.')
      return
    }

    // Set camera active first to show video element
    cameraActive.value = true
    
    // Wait for DOM to update
    await nextTick()
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
    })
    
    streamRef.value = stream
    
    // Wait a bit more to ensure video element is ready
    await nextTick()
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      
      // Wait for video to load metadata
      await new Promise((resolve, reject) => {
        if (!videoRef.value) {
          reject(new Error('Video element not found'))
          return
        }
        
        const video = videoRef.value
        
        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.play()
            .then(() => resolve())
            .catch(reject)
        }
        
        const onError = () => {
          video.removeEventListener('error', onError)
          reject(new Error('Video failed to load'))
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('error', onError)
        
        // Fallback timeout
        setTimeout(() => {
          if (video.readyState >= 2) {
            video.play().then(resolve).catch(reject)
          } else {
            reject(new Error('Video loading timeout'))
          }
        }, 3000)
      })
    } else {
      throw new Error('Video element not found')
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    cameraActive.value = false
    
    let errorMessage = 'Unable to access camera. '
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage += 'Please allow camera access in your browser settings.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage += 'No camera found. Please connect a camera and try again.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage += 'Camera is already in use by another application.'
    } else if (error.message === 'Video element not found') {
      errorMessage = 'Camera interface not ready. Please try again.'
    } else {
      errorMessage += 'Please check your camera permissions and try again.'
    }
    
    showNotification('error', 'Camera Error', errorMessage)
    
    // Clean up stream if it was created
    if (streamRef.value) {
      streamRef.value.getTracks().forEach(track => track.stop())
      streamRef.value = null
    }
  }
}

const stopCamera = () => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((track) => track.stop())
    streamRef.value = null
  }
  cameraActive.value = false
}

const captureSelfie = () => {
  if (!videoRef.value || !canvasRef.value) {
    showNotification('error', 'Camera Not Ready', 'Please try activating the camera again.')
    return
  }

  const video = videoRef.value
  const canvas = canvasRef.value

  // Check if video is ready
  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    showNotification('warning', 'Please Wait', 'Camera is initializing. Please wait a moment and try again.')
    return
  }

  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      showNotification('error', 'Capture Failed', 'Unable to capture image. Please try again.')
      return
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Flip the canvas horizontally to un-mirror the image
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    // Draw video frame to canvas (now un-mirrored)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Convert to image
    const imageData = canvas.toDataURL('image/jpeg', 0.95)
    
    if (!imageData || imageData === 'data:,') {
      showNotification('error', 'Capture Failed', 'Failed to capture image. Please try again.')
      return
    }

    selfieImage.value = imageData
    stopCamera()
    showNotification('success', 'Selfie Captured', 'Your selfie has been captured successfully.')
  } catch (error) {
    console.error('Error capturing selfie:', error)
    showNotification('error', 'Capture Failed', 'Failed to capture image. Please try again.')
  }
}

const handleIdFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('error', 'Invalid File Type', 'Please select an image file (JPG, PNG, etc.)')
    e.target.value = '' // Reset input
    return
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    showNotification('error', 'File Too Large', 'Please select an image smaller than 10MB.')
    e.target.value = '' // Reset input
    return
  }

  const reader = new FileReader()
  reader.onload = async (event) => {
    idImage.value = event.target?.result
    
    // Extract data from ID image
    extractingData.value = true
    try {
      const formData = new FormData()
      formData.append('idImage', file, 'id-front.jpg')
      formData.append('ocrModel', ocrModel.value)
      
      const response = await axios.post('/api/extract-id-data', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      if (response.data && response.data.extracted) {
        const data = response.data.extracted
        // Auto-fill form fields
        if (data.fullName && !fullName.value) {
          fullName.value = data.fullName
        }
        if (data.idNumber && !nationalId.value) {
          nationalId.value = data.idNumber
        }
        if (data.dateOfBirth && !dateOfBirth.value) {
          // Convert date format if needed
          const dob = data.dateOfBirth.replace(/\./g, '-')
          dateOfBirth.value = dob.includes('-') ? dob : data.dateOfBirth
        }
      }
    } catch (error) {
      console.error('Error extracting ID data:', error)
      // Don't show error to user, just continue
    } finally {
      extractingData.value = false
    }
  }
  reader.onerror = () => {
    showNotification('error', 'File Read Error', 'Error reading file. Please try again.')
    e.target.value = '' // Reset input
  }
  reader.readAsDataURL(file)
}

const handleIdBackFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('error', 'Invalid File Type', 'Please select an image file (JPG, PNG, etc.)')
    e.target.value = '' // Reset input
    return
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    showNotification('error', 'File Too Large', 'Please select an image smaller than 10MB.')
    e.target.value = '' // Reset input
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    idBackImage.value = event.target?.result
  }
  reader.onerror = () => {
    showNotification('error', 'File Read Error', 'Error reading file. Please try again.')
    e.target.value = '' // Reset input
  }
  reader.readAsDataURL(file)
}

const validateForm = () => {
  errors.value = {} // Clear previous errors
  
  let isValid = true

  if (!fullName.value.trim()) {
    errors.value.fullName = 'Please enter your full name'
    isValid = false
  }
  
  if (!nationalId.value.trim()) {
    errors.value.nationalId = 'Please enter your national ID number'
    isValid = false
  } else if (!validateKenyanId(nationalId.value)) {
    errors.value.nationalId = 'Invalid Kenyan ID format. Please enter a 6-10 digit ID number.'
    isValid = false
  }
  
  if (!dateOfBirth.value) {
    errors.value.dateOfBirth = 'Please enter your date of birth'
    isValid = false
  }
  
  if (!phoneNumber.value.trim()) {
    errors.value.phoneNumber = 'Please enter your phone number'
    isValid = false
  }
  
  if (!address.value.trim()) {
    errors.value.address = 'Please enter your address'
    isValid = false
  }
  
  if (!idImage.value) {
    showNotification('error', 'Missing ID Image', 'Please upload the front side of your national ID image')
    isValid = false
  }
  
  if (!idBackImage.value) {
    showNotification('error', 'Missing ID Back Image', 'Please upload the back side of your national ID image')
    isValid = false
  }
  
  if (!selfieImage.value) {
    showNotification('error', 'Missing Selfie', 'Please capture a selfie for verification')
    isValid = false
  }

  if (!isValid) {
    // Scroll to first error
    const firstErrorField = Object.keys(errors.value)[0]
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                     document.querySelector(`input[v-model="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
    showNotification('error', 'Validation Error', 'Please fill in all required fields correctly.')
  }

  return isValid
}

const submitForm = async (e) => {
  e.preventDefault()

  if (!validateForm()) return

  loading.value = true
  response.value = null

  try {
    const formData = new FormData()
    formData.append('fullName', fullName.value.trim())
    formData.append('nationalId', nationalId.value.trim())
    formData.append('dateOfBirth', dateOfBirth.value)
    formData.append('phoneNumber', phoneNumber.value.trim())
    formData.append('address', address.value.trim())
    formData.append('ocrModel', ocrModel.value)
    if (faceModel.value) {
      formData.append('faceModel', faceModel.value)
    }

    // Convert base64 images to blobs
    if (idImage.value) {
      try {
        const idBlob = await fetch(idImage.value).then((res) => res.blob())
        formData.append('idImage', idBlob, 'id-front.jpg')
      } catch (error) {
        console.error('Error processing ID image:', error)
        throw new Error('Failed to process ID image. Please try uploading again.')
      }
    }

    if (idBackImage.value) {
      try {
        const idBackBlob = await fetch(idBackImage.value).then((res) => res.blob())
        formData.append('idBackImage', idBackBlob, 'id-back.jpg')
      } catch (error) {
        console.error('Error processing ID back image:', error)
        throw new Error('Failed to process ID back image. Please try uploading again.')
      }
    }

    if (selfieImage.value) {
      try {
        const selfieBlob = await fetch(selfieImage.value).then((res) => res.blob())
        formData.append('selfieImage', selfieBlob, 'selfie.jpg')
      } catch (error) {
        console.error('Error processing selfie:', error)
        throw new Error('Failed to process selfie. Please try capturing again.')
      }
    }

    const result = await axios.post('/api/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout for processing
    })

    localStorage.setItem('registrationResult', JSON.stringify(result.data))
    router.push('/results')
  } catch (error) {
    console.error('Registration error:', error)
    
    let errorMessage = 'Registration failed. Please try again.'
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'Request timed out. The server may be processing your images. Please wait a moment and try again.'
    } else if (error.response) {
      errorMessage = error.response.data?.message || errorMessage
    } else if (error.request) {
      errorMessage = 'Unable to connect to server. Please make sure the backend is running.'
    }
    
    response.value = {
      status: 'error',
      message: errorMessage,
    }
  } finally {
    loading.value = false
  }
}

// Load available OCR models from backend
const loadOcrModels = async () => {
  try {
    const response = await axios.get('/api/ocr-models')
    if (response.data && response.data.models) {
      availableOcrModels.value = response.data.models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        requiresApiKey: model.requiresApiKey,
        isConfigured: model.isConfigured,
      }))
      
      // Set default to first available model
      if (availableOcrModels.value.length > 0) {
        const defaultModel = availableOcrModels.value.find(m => m.isConfigured) || availableOcrModels.value[0]
        ocrModel.value = defaultModel.id
      }
    }
  } catch (error) {
    console.error('Error loading OCR models:', error)
    // Keep default models if API fails
  }
}

// Load available face detection models from backend
const loadFaceModels = async () => {
  try {
    const response = await axios.get('/api/face-models')
    if (response.data && response.data.models) {
      availableFaceModels.value = response.data.models.map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        isAvailable: model.isAvailable,
      }))
      
      // Set default to first available model
      if (availableFaceModels.value.length > 0) {
        const defaultModel = availableFaceModels.value.find(m => m.isAvailable)
        if (defaultModel) {
          faceModel.value = defaultModel.id
        }
      }
    }
  } catch (error) {
    console.error('Error loading face detection models:', error)
    // Keep default models if API fails
  }
}

onMounted(() => {
  loadOcrModels()
  loadFaceModels()
})

const openCropModal = (type, imageSrc) => {
  cropImageType.value = type
  cropImageSrc.value = imageSrc
  showCropModal.value = true
}

const closeCropModal = () => {
  showCropModal.value = false
  cropImageType.value = null
  cropImageSrc.value = null
}

const handleCropped = (croppedImageSrc) => {
  if (cropImageType.value === 'front') {
    idImage.value = croppedImageSrc
    showNotification('success', 'Image Cropped', 'Front ID image has been cropped successfully.')
  } else if (cropImageType.value === 'back') {
    idBackImage.value = croppedImageSrc
    showNotification('success', 'Image Cropped', 'Back ID image has been cropped successfully.')
  }
  closeCropModal()
}

onBeforeUnmount(() => {
  stopCamera()
})
</script>
