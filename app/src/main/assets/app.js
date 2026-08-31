/**
 * ( zono ) Royal Experience Engine
 * Handles Web Audio Bird Synthesis, 3D Tilt Parallax, Gold Dust Particles & Navigation
 */

// ============================================================================
// 1. High-Fidelity Web Audio Sound Engine (صوت الطير والأجراس الملكية)
// ============================================================================
class ZonoAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.analyser = null;
    this.dataArray = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic Bird Song / Chirp (تغريد وهديل الزاجل)
  playBirdSong() {
    if (this.isMuted) return;
    this.initContext();

    const startTime = this.ctx.currentTime;
    const notes = [
      { f1: 2100, f2: 3400, dur: 0.08, delay: 0 },
      { f1: 3400, f2: 2400, dur: 0.12, delay: 0.09 },
      { f1: 2600, f2: 3800, dur: 0.09, delay: 0.25 },
      { f1: 3800, f2: 2200, dur: 0.15, delay: 0.35 },
      { f1: 2900, f2: 4100, dur: 0.07, delay: 0.55 },
      { f1: 4100, f2: 2800, dur: 0.18, delay: 0.63 },
    ];

    notes.forEach(note => {
      const t = startTime + note.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f1, t);
      osc.frequency.exponentialRampToValueAtTime(note.f2, t + note.dur * 0.5);
      osc.frequency.exponentialRampToValueAtTime(note.f1 * 0.9, t + note.dur);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);

      osc.connect(gain);
      gain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.dur + 0.05);
    });

    this.triggerWaveAnimation();
  }

  // Realistic Wing Flutter / Flap (رفرفة الأجنحة)
  playWingFlap() {
    if (this.isMuted) return;
    this.initContext();

    const startTime = this.ctx.currentTime;
    const flapCount = 5;

    for (let i = 0; i < flapCount; i++) {
      const t = startTime + i * 0.06;
      
      // Noise buffer for air flutter
      const bufferSize = this.ctx.sampleRate * 0.06;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        output[j] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350 + i * 50, t);
      filter.Q.setValueAtTime(3, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.058);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      whiteNoise.start(t);
    }
  }

  // Royal Golden Chime / Harp (رنين الذهب الملكي)
  playRoyalChime() {
    if (this.isMuted) return;
    this.initContext();

    const chord = [587.33, 739.99, 880.00, 1174.66, 1479.98, 1760.00]; // D Major Pentatonic
    const startTime = this.ctx.currentTime;

    chord.forEach((freq, index) => {
      const t = startTime + index * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

      osc.connect(gain);
      gain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 2.0);
    });

    this.triggerWaveAnimation();
  }

  // Combined Royal Sovereign Fanfare & Pigeon Flight
  playSovereignFanfare() {
    this.playWingFlap();
    setTimeout(() => this.playBirdSong(), 150);
    setTimeout(() => this.playRoyalChime(), 350);
  }

  triggerWaveAnimation() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.classList.add('sound-playing');
      setTimeout(() => btn.classList.remove('sound-playing'), 1800);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const icon = document.getElementById('soundIcon');
    if (icon) {
      icon.textContent = this.isMuted ? '🔇' : '🔊';
    }
    return this.isMuted;
  }
}

window.ZonoAudio = new ZonoAudioEngine();

// ============================================================================
// 2. Interactive Gold Dust & Star Particles Canvas
// ============================================================================
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = window.innerWidth < 768 ? 40 : 85;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.initParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.8 + 0.8,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6 - 0.2, // gentle upward drift
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.3 ? '#dfba5b' : '#ffffff'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha += Math.sin(Date.now() * p.twinkleSpeed) * 0.015;

      // Wrap around
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Draw glowing particle
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#dfba5b';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================================================
// 3. Audio Visualizer Canvas
// ============================================================================
class AudioVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.draw();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = 120;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (window.ZonoAudio && window.ZonoAudio.analyser) {
      window.ZonoAudio.analyser.getByteFrequencyData(window.ZonoAudio.dataArray);
      const barWidth = (this.width / window.ZonoAudio.dataArray.length) * 2.5;
      let x = 0;

      for (let i = 0; i < window.ZonoAudio.dataArray.length; i++) {
        const barHeight = (window.ZonoAudio.dataArray[i] / 255) * this.height * 0.8;

        const grad = this.ctx.createLinearGradient(0, this.height, 0, this.height - barHeight);
        grad.addColorStop(0, 'rgba(223, 186, 91, 0.05)');
        grad.addColorStop(1, 'rgba(246, 226, 122, 0.7)');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x, this.height - barHeight, barWidth - 4, barHeight);
        x += barWidth + 2;
      }
    }

    requestAnimationFrame(() => this.draw());
  }
}

// ============================================================================
// 4. 3D Card Parallax Tilt Effect
// ============================================================================
function init3DTilt(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;

  document.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - cardCenterX) / (window.innerWidth / 2);
    const deltaY = (e.clientY - cardCenterY) / (window.innerHeight / 2);

    const rotateX = -deltaY * 10;
    const rotateY = deltaX * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  // Touch device gyroscope support if available
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        const tiltX = Math.min(Math.max(e.gamma, -20), 20) * 0.5;
        const tiltY = Math.min(Math.max(e.beta - 45, -20), 20) * 0.5;
        card.style.transform = `perspective(1000px) rotateX(${-tiltY}deg) rotateY(${tiltX}deg)`;
      }
    });
  }
}

// ============================================================================
// 5. Application Initialization & Interaction Setup
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Visual Systems
  new ParticleSystem('particleCanvas');
  new AudioVisualizer('audioVisualizer');
  init3DTilt('heroCard');

  // Sound Toggle Button
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      window.ZonoAudio.toggleMute();
      if (!window.ZonoAudio.isMuted) {
        window.ZonoAudio.playBirdSong();
      }
    });
  }

  // Chirp Button on Pigeon Image
  const chirpBtn = document.getElementById('chirpBtn');
  const pigeonImgWrapper = document.querySelector('.pigeon-image-wrapper');
  
  if (chirpBtn) {
    chirpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.ZonoAudio.playSovereignFanfare();
    });
  }

  if (pigeonImgWrapper) {
    pigeonImgWrapper.addEventListener('click', () => {
      window.ZonoAudio.playSovereignFanfare();
    });
  }

  // Quick Sound Chips
  document.querySelectorAll('.audio-chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute('data-sound');
      if (soundType === 'warble') window.ZonoAudio.playBirdSong();
      if (soundType === 'wings') window.ZonoAudio.playWingFlap();
      if (soundType === 'royalChime') window.ZonoAudio.playRoyalChime();
    });
  });

  // Enter App Transition (دخولية التطبيق)
  const enterAppBtn = document.getElementById('enterAppBtn');
  const splashSection = document.getElementById('splashSection');
  const portalSection = document.getElementById('portalSection');
  const backToSplashBtn = document.getElementById('backToSplashBtn');

  if (enterAppBtn) {
    enterAppBtn.addEventListener('click', () => {
      // Play triumphant fanfare & bird flap
      window.ZonoAudio.playSovereignFanfare();

      // Screen transition
      splashSection.classList.remove('active');
      setTimeout(() => {
        portalSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 400);
    });
  }

  if (backToSplashBtn) {
    backToSplashBtn.addEventListener('click', () => {
      portalSection.classList.remove('active');
      setTimeout(() => {
        splashSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 400);
    });
  }

  // Glowing Title Click Interaction
  const title = document.getElementById('glowingTitle');
  if (title) {
    title.addEventListener('click', () => {
      window.ZonoAudio.playRoyalChime();
    });
  }
});

window.openMainZono = function(){ window.location.href="https://zziis.github.io/ZUNO/"; };
