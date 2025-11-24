<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="glass rounded-2xl p-6 border border-color-border/30 max-w-3xl w-full max-h-[90vh] overflow-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-foreground">Crop ID Image</h3>
        <button
          @click="$emit('close')"
          class="text-foreground/50 hover:text-foreground transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
      
      <div class="mb-4 relative bg-black/20 rounded-lg overflow-hidden" style="max-height: 60vh;">
        <canvas
          ref="canvasRef"
          class="max-w-full h-auto"
          @mousedown="startCrop"
          @mousemove="updateCrop"
          @mouseup="endCrop"
          @mouseleave="endCrop"
        />
        <div
          v-if="isCropping"
          class="absolute border-2 border-primary pointer-events-none"
          :style="{
            left: cropBox.x + 'px',
            top: cropBox.y + 'px',
            width: cropBox.width + 'px',
            height: cropBox.height + 'px',
          }"
        />
      </div>
      
      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-surface-light/50 hover:bg-surface-light/70 text-foreground font-semibold rounded-lg transition-all border border-color-border/30"
        >
          Cancel
        </button>
        <button
          @click="applyCrop"
          class="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all glow-cyan"
        >
          Apply Crop
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'cropped'])

const canvasRef = ref(null)
const isCropping = ref(false)
const cropBox = ref({ x: 0, y: 0, width: 0, height: 0 })
const startPos = ref({ x: 0, y: 0 })
const image = ref(null)

onMounted(() => {
  loadImage()
})

watch(() => props.imageSrc, () => {
  loadImage()
})

const loadImage = () => {
  const img = new Image()
  img.onload = () => {
    image.value = img
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
  }
  img.src = props.imageSrc
}

const startCrop = (e) => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  isCropping.value = true
  startPos.value = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
  cropBox.value = {
    x: startPos.value.x,
    y: startPos.value.y,
    width: 0,
    height: 0,
  }
}

const updateCrop = (e) => {
  if (!isCropping.value) return
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  const currentX = (e.clientX - rect.left) * scaleX
  const currentY = (e.clientY - rect.top) * scaleY
  
  cropBox.value = {
    x: Math.min(startPos.value.x, currentX),
    y: Math.min(startPos.value.y, currentY),
    width: Math.abs(currentX - startPos.value.x),
    height: Math.abs(currentY - startPos.value.y),
  }
}

const endCrop = () => {
  isCropping.value = false
}

const applyCrop = () => {
  if (!image.value || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // Get crop dimensions
  const { x, y, width, height } = cropBox.value
  
  if (width === 0 || height === 0) {
    // No crop selected, use full image
    emit('cropped', props.imageSrc)
    emit('close')
    return
  }
  
  // Create new canvas for cropped image
  const croppedCanvas = document.createElement('canvas')
  croppedCanvas.width = width
  croppedCanvas.height = height
  const croppedCtx = croppedCanvas.getContext('2d')
  
  // Draw cropped portion
  croppedCtx.drawImage(
    image.value,
    x, y, width, height,
    0, 0, width, height
  )
  
  // Convert to data URL
  const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95)
  emit('cropped', croppedDataUrl)
  emit('close')
}
</script>

