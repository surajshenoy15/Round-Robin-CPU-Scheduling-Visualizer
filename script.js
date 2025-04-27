let processes = [];
let currentTime = 0;
let isRunning = false;

function addProcess() {
    const process = {
        id: processes.length + 1,
        arrivalTime: 0,
        burstTime: 0,
        remainingTime: 0,
        waitingTime: 0,
        turnaroundTime: 0,
        completed: false
    };
    processes.push(process);
    updateProcessTable();
}

function updateProcessTable() {
    const tbody = document.getElementById('processTable');
    tbody.innerHTML = '';
    
    processes.forEach((process, index) => {
        const tr = document.createElement('tr');
        tr.className = 'animate-fadeIn hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4">P${process.id}</td>
            <td class="px-6 py-4">
                <input type="number" value="${process.arrivalTime}" 
                    class="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    onchange="updateProcess(${index}, 'arrivalTime', this.value)">
            </td>
            <td class="px-6 py-4">
                <input type="number" value="${process.burstTime}"
                    class="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    onchange="updateProcess(${index}, 'burstTime', this.value)">
            </td>
            <td class="px-6 py-4">${process.waitingTime}</td>
            <td class="px-6 py-4">${process.turnaroundTime}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-sm ${
                    process.completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                }">
                    ${process.completed ? 'Completed' : 'Waiting'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateProcess(index, field, value) {
    processes[index][field] = parseInt(value);
    if (field === 'burstTime') {
        processes[index].remainingTime = parseInt(value);
    }
}

// Make startVisualization async
async function startVisualization() {
    if (processes.length === 0) {
        alert('Please add processes first!');
        return;
    }

    const timeQuantum = parseInt(document.getElementById('timeQuantum').value) || 2;
    isRunning = true;
    document.getElementById('startBtn').disabled = true;

    let queue = [...processes];
    let completed = 0;
    currentTime = 0;

    try {
        while (completed < processes.length && isRunning) {
            const currentProcess = queue[0];
            
            if (currentProcess.remainingTime > 0) {
                const executeTime = Math.min(timeQuantum, currentProcess.remainingTime);
                await executeProcess(currentProcess, executeTime);
                currentProcess.remainingTime -= executeTime;
                currentTime += executeTime;

                processes.forEach(p => {
                    if (p.id !== currentProcess.id && !p.completed && p.arrivalTime <= currentTime) {
                        p.waitingTime += executeTime;
                    }
                });

                if (currentProcess.remainingTime === 0) {
                    currentProcess.completed = true;
                    currentProcess.turnaroundTime = currentTime - currentProcess.arrivalTime;
                    completed++;
                }
            }

            queue.push(queue.shift());
            updateProcessTable();
            updateStats();
        }

        // Show completion effects after all processes are done
        await showCompletionEffects();
    } catch (error) {
        console.error('Error during visualization:', error);
    } finally {
        document.getElementById('startBtn').disabled = false;
    }
}

// Add at the beginning of the file
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particles.js
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#6366f1' },
            shape: { type: 'circle' },
            opacity: {
                value: 0.5,
                random: true,
                animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
            },
            size: {
                value: 3,
                random: true,
                animation: { enable: true, speed: 2, minimumValue: 0.1, sync: false }
            },
            move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: false,
                straight: false,
                outModes: { default: 'out' },
                attract: { enable: false, rotateX: 600, rotateY: 1200 }
            }
        },
        interactivity: {
            detectsOn: 'canvas',
            events: {
                onHover: { enable: true, mode: 'repulse' },
                onClick: { enable: true, mode: 'push' },
                resize: true
            }
        },
        retina_detect: true
    });

    // Simplified heading animation
    const heading = document.querySelector('h1');
    heading.style.opacity = '0'; // Start hidden
    heading.style.transform = 'translateY(30px)'; // Start slightly below

    // Animate heading in with fade and upward movement
    gsap.to(heading, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
    });

    // Subtle hover effect: slight scale
    heading.addEventListener('mouseenter', () => {
        gsap.to(heading, {
            scale: 1.05,
            duration: 0.3
        });
    });
    heading.addEventListener('mouseleave', () => {
        gsap.to(heading, {
            scale: 1,
            duration: 0.3
        });
    });

    // Existing GSAP animation
    gsap.to('#mainContainer', {
        opacity: 1,
        duration: 1,
        ease: 'power2.out'
    });

    // Add floating animation to cards
    gsap.to('.stat-card', {
        y: -10,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
        stagger: 0.1
    });
});

// Modify the executeProcess function for smoother animations
async function executeProcess(process, time) {
    const ganttChart = document.getElementById('ganttChart');
    const block = document.createElement('div');
    block.className = 'process-block absolute h-full flex items-center justify-center text-white font-semibold rounded-lg overflow-hidden';
    block.style.left = `${currentTime * 50}px`;
    block.style.width = `${time * 50}px`;
    block.style.backgroundColor = `hsl(${(process.id * 50) % 360}, 70%, 60%)`;
    block.innerHTML = `
        <div class="relative z-10">P${process.id}</div>
        <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 shimmer"></div>
    `;
    ganttChart.appendChild(block);

    gsap.fromTo(block, 
        {
            width: 0,
            opacity: 0,
            scale: 0.8,
            x: -20
        },
        {
            width: `${time * 50}px`,
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.8)"
        }
    );

    await new Promise(resolve => setTimeout(resolve, time * 250));
}

// Modify updateStats for smooth number transitions
function updateStats() {
    const avgWaiting = processes.reduce((sum, p) => sum + p.waitingTime, 0) / processes.length;
    const avgTurnaround = processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / processes.length;
    
    gsap.to('#avgWaitingTime', {
        innerHTML: avgWaiting.toFixed(2),
        duration: 0.5,
        snap: { innerHTML: 0.01 }
    });
    gsap.to('#avgTurnaroundTime', {
        innerHTML: avgTurnaround.toFixed(2),
        duration: 0.5,
        snap: { innerHTML: 0.01 }
    });
    gsap.to('#currentTime', {
        innerHTML: currentTime,
        duration: 0.3,
        snap: { innerHTML: 1 }
    });
}

// Initialize
updateProcessTable();

async function showCompletionEffects() {
    // Animate completed process blocks
    gsap.to('.process-block', {
        scale: 1.05,
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        stagger: 0.1,
        duration: 0.5,
        ease: 'back.out(1.7)'
    });

    // Modern confetti effect
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.rotate = `${Math.random() * 360}deg`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }

    // Create and show modern summary modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 opacity-0';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div class="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl w-96 transform scale-95 transition-all duration-300">
            <div class="text-center mb-6">
                <div class="inline-block p-3 rounded-full bg-green-100 mb-4">
                    <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                    Execution Complete!
                </h3>
                <p class="text-gray-600">All processes have been successfully scheduled</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <div class="bg-purple-50 rounded-xl p-4 transform hover:scale-[1.02] transition-all duration-300">
                    <p class="text-sm text-purple-600 mb-1">Total Execution Time</p>
                    <p class="text-2xl font-bold text-purple-700">${currentTime} units</p>
                </div>
                <div class="bg-blue-50 rounded-xl p-4 transform hover:scale-[1.02] transition-all duration-300">
                    <p class="text-sm text-blue-600 mb-1">Processes Completed</p>
                    <p class="text-2xl font-bold text-blue-700">${processes.length}</p>
                </div>
                <div class="bg-green-50 rounded-xl p-4 transform hover:scale-[1.02] transition-all duration-300">
                    <p class="text-sm text-green-600 mb-1">Average Turnaround Time</p>
                    <p class="text-2xl font-bold text-green-700">${(processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / processes.length).toFixed(2)}</p>
                </div>
            </div>

            <button onclick="this.parentElement.parentElement.remove()" 
                class="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl
                hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300">
                Close Summary
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    // Animate modal entrance
    gsap.to(modal, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
    });
    
    gsap.to(modal.children[1], {
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.7)'
    });
}