<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="glass rounded-2xl p-6 border border-color-border/30 max-w-3xl w-full max-h-[90vh] overflow-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-foreground">Rotate ID Image</h3>
        <button
          @click="$emit('close')"
          class="text-foreground/50 hover:text-foreground transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
      
      <div class="mb-4 relative bg-black/20 rounded-lg overflow-hidden flex items-center justify-center" style="max-height: 60vh; min-height: 300px;">
        <img
          ref="imageRef"
          :src="imageSrc"
          alt="Image to rotate"
          class="max-w-full max-h-full object-contain"
          :style="{ transform: `rotate(${rotation}deg)` }"
        />
      </div>
      
      <div class="mb-4 flex items-center justify-center gap-4">
        <button
          @click="rotate(-90)"
          class="px-4 py-2 bg-surface-light/50 hover:bg-surface-light/70 text-foreground font-semibold rounded-lg transition-all border border-color-border/30 flex items-center gap-2"
        >
          <RotateCcw class="h-5 w-5" />
          Rotate Left
        </button>
        <div class="text-foreground/70 font-medium">
          {{ rotation }}°
        </div>
        <button
          @click="rotate(90)"
          class="px-4 py-2 bg-surface-light/50 hover:bg-surface-light/70 text-foreground font-semibold rounded-lg transition-all border border-color-border/30 flex items-center gap-2"
        >
          <RotateCw class="h-5 w-5" />
          Rotate Right
        </button>
        <button
          @click="resetRotation"
          class="px-4 py-2 bg-surface-light/30 hover:bg-surface-light/50 text-foreground/70 font-semibold rounded-lg transition-all border border-color-border/20"
        >
          Reset
        </button>
      </div>
      
      <div class="flex gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-surface-light/50 hover:bg-surface-light/70 text-foreground font-semibold rounded-lg transition-all border border-color-border/30"
        >
          Cancel
        </button>
        <button
          @click="applyRotation"
          class="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent-1 hover:from-primary-dark hover:to-primary text-background font-semibold rounded-lg transition-all glow-cyan"
        >
          Apply Rotation
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, RotateCw, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'rotated'])

const imageRef = ref(null)
const rotation = ref(0)

const rotate = (degrees) => {
  rotation.value = (rotation.value + degrees) % 360
}

const resetRotation = () => {
  rotation.value = 0
}

const applyRotation = () => {
  if (rotation.value === 0) {
    emit('rotated', props.imageSrc)
    emit('close')
    return
  }
  
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Calculate new canvas size based on rotation
    if (rotation.value === 90 || rotation.value === 270 || rotation.value === -90 || rotation.value === -270) {
      canvas.width = img.height
      canvas.height = img.width
    } else {
      canvas.width = img.width
      canvas.height = img.height
    }
    
    // Translate and rotate
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    
    // Convert to data URL
    const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
    emit('rotated', rotatedDataUrl)
    emit('close')
  }
  img.src = props.imageSrc
}
</script>

