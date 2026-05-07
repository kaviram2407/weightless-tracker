document.addEventListener('DOMContentLoaded', () => {
    const prevDateBtn = document.getElementById('prev-date');
    const nextDateBtn = document.getElementById('next-date');
    const currentDateDisplay = document.getElementById('current-date-display');
    const newActivityInput = document.getElementById('new-activity-input');
    const newActivityTime = document.getElementById('new-activity-time');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const activityList = document.getElementById('activity-list');
    const exportBtn = document.getElementById('export-btn');
    const mainContainer = document.querySelector('.glass-container');
    const currentTimeDisplay = document.getElementById('current-time-display');

    // Custom Modal Elements
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalInputContainer = document.getElementById('modal-input-container');
    const modalInput = document.getElementById('modal-input');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    let currentDate = new Date();
    let activeIntervals = [];

    const clearAllIntervals = () => {
        activeIntervals.forEach(id => clearInterval(id));
        activeIntervals = [];
    };

    // Modal Logic
    const showModal = ({ title, message, type = 'alert', expectedAnswer = null }) => {
        return new Promise((resolve) => {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modalInput.value = '';
            
            if (type === 'math') {
                modalInputContainer.classList.remove('hidden');
                modalCancelBtn.style.display = 'block';
            } else if (type === 'confirm') {
                modalInputContainer.classList.add('hidden');
                modalCancelBtn.style.display = 'block';
            } else { // alert
                modalInputContainer.classList.add('hidden');
                modalCancelBtn.style.display = 'none';
            }

            customModalOverlay.classList.add('active');
            
            if (type === 'math') {
                setTimeout(() => modalInput.focus(), 100);
            }

            const handleConfirm = () => {
                if (type === 'math') {
                    const ans = parseInt(modalInput.value.trim());
                    if (ans === expectedAnswer) {
                        closeModal();
                        resolve(true);
                    } else {
                        modalInput.classList.add('error-shake');
                        setTimeout(() => modalInput.classList.remove('error-shake'), 400);
                        modalInput.value = '';
                        modalInput.focus();
                    }
                } else {
                    closeModal();
                    resolve(true);
                }
            };

            const handleCancel = () => {
                closeModal();
                resolve(false);
            };

            const closeModal = () => {
                customModalOverlay.classList.remove('active');
                modalConfirmBtn.removeEventListener('click', handleConfirm);
                modalCancelBtn.removeEventListener('click', handleCancel);
                modalInput.removeEventListener('keypress', handleKeypress);
            };

            const handleKeypress = (e) => {
                if (e.key === 'Enter') handleConfirm();
            };

            modalConfirmBtn.addEventListener('click', handleConfirm);
            modalCancelBtn.addEventListener('click', handleCancel);
            if (type === 'math') {
                modalInput.addEventListener('keypress', handleKeypress);
            }
        });
    };

    const runMathChallenge = async () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        
        return await showModal({
            title: 'Focus Verification',
            message: `What is ${a} + ${b}?`,
            type: 'math',
            expectedAnswer: a + b
        });
    };

    // Setup real-time clock
    const updateClock = () => {
        const now = new Date();
        currentTimeDisplay.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    
    updateClock();
    setInterval(updateClock, 1000);

    // Format date as YYYY-MM-DD
    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Format date for display
    const getDisplayDate = (date) => {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) return 'Today';
        
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const loadState = () => {
        const dateKey = formatDate(currentDate);
        const stored = localStorage.getItem(dateKey);
        return stored ? JSON.parse(stored) : [];
    };

    const saveState = (activities) => {
        const dateKey = formatDate(currentDate);
        localStorage.setItem(dateKey, JSON.stringify(activities));
    };

    const updateDisplayDate = () => {
        currentDateDisplay.textContent = getDisplayDate(currentDate);
    };

    const createActivityElement = (activity, index) => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'activity-name';
        nameSpan.textContent = activity.name;

        const activityControls = document.createElement('div');
        activityControls.className = 'activity-controls';

        // 1. TOTAL TIME CONTROLS (Only displays the set time now)
        const timeControlsDiv = document.createElement('div');
        timeControlsDiv.className = 'time-controls';

        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'time-display';
        let currentInit = activity.initialTime || activity.time || 0;
        timeDisplay.textContent = `${currentInit}m`;
        timeControlsDiv.appendChild(timeDisplay);

        // 2. COUNTDOWN TIMER
        const countdownDisplay = document.createElement('div');
        countdownDisplay.className = 'countdown-display';
        countdownDisplay.style.display = 'none';

        // 3. STATS BADGE (For Completed State)
        const statsBadge = document.createElement('div');
        statsBadge.style.display = 'none';

        // 4. EXTRA ACTIONS (Pause/Extend)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'extra-actions';
        
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'action-btn pause-btn';
        pauseBtn.textContent = 'Pause';
        pauseBtn.style.display = 'none';

        const extendBtn = document.createElement('button');
        extendBtn.className = 'action-btn extend-btn';
        extendBtn.textContent = '+5m';
        extendBtn.style.display = 'none';
        
        actionsDiv.appendChild(pauseBtn);
        actionsDiv.appendChild(extendBtn);

        // 5. STATUS BUTTON
        const statusBtn = document.createElement('button');
        statusBtn.className = 'status-btn';

        const syncDOM = () => {
            const now = Date.now();
            let activities = loadState();
            let act = activities[index];

            if (!act) return;

            let cInit = act.initialTime || act.time || 0;
            let cExt = act.extendedTime || 0;

            if (act.status === 'In Progress') {
                let rem = act.endTime - now;
                if (rem <= 0) {
                    act.status = 'Completed';
                    act.remainingWhenPaused = 0;
                    act.savedTime = 0;
                    act.extraTime = cExt;
                    saveState(activities);
                    renderActivities();
                    return;
                }
                
                let totalSec = Math.floor(rem / 1000);
                let m = Math.floor(totalSec / 60);
                let s = totalSec % 60;
                countdownDisplay.textContent = `${m}:${s.toString().padStart(2, '0')}`;
                
                if (rem <= 600000) { // 10 minutes
                    pauseBtn.style.display = 'block';
                    extendBtn.style.display = 'block';
                } else {
                    pauseBtn.style.display = 'none';
                    extendBtn.style.display = 'none';
                }
            } else if (act.status === 'Paused') {
                let rem = act.remainingWhenPaused || 0;
                let totalSec = Math.floor(rem / 1000);
                let m = Math.floor(totalSec / 60);
                let s = totalSec % 60;
                countdownDisplay.textContent = `${m}:${s.toString().padStart(2, '0')}`;
                pauseBtn.textContent = 'Resume';
                
                if (rem <= 600000) {
                    pauseBtn.style.display = 'block';
                    extendBtn.style.display = 'block';
                } else {
                    pauseBtn.style.display = 'none';
                    extendBtn.style.display = 'none';
                }
            }
        };

        let currentStatus = activity.status || 'To Do';
        
        if (currentStatus === 'In Progress') {
            timeControlsDiv.style.display = 'none';
            statsBadge.style.display = 'none';
            countdownDisplay.style.display = 'block';
            statusBtn.textContent = 'In Progress';
            statusBtn.className = 'status-btn status-progress';
            let timerInterval = setInterval(syncDOM, 1000);
            activeIntervals.push(timerInterval);
            syncDOM();
        } else if (currentStatus === 'Paused') {
            timeControlsDiv.style.display = 'none';
            statsBadge.style.display = 'none';
            countdownDisplay.style.display = 'block';
            statusBtn.textContent = 'Paused';
            statusBtn.className = 'status-btn status-paused';
            syncDOM();
        } else if (currentStatus === 'Completed') {
            timeControlsDiv.style.display = 'none';
            countdownDisplay.style.display = 'none';
            actionsDiv.style.display = 'none';
            
            statsBadge.style.display = 'block';
            let sTime = activity.savedTime || 0;
            let eTime = activity.extraTime || 0;

            if (sTime > 0) {
                statsBadge.textContent = `Saved: ${sTime}m`;
                statsBadge.className = 'stats-badge saved';
            } else if (eTime > 0) {
                statsBadge.textContent = `Extra: ${eTime}m`;
                statsBadge.className = 'stats-badge extra';
            } else {
                statsBadge.textContent = `On Time`;
                statsBadge.className = 'stats-badge ontime';
            }

            statusBtn.textContent = 'Completed';
            statusBtn.className = 'status-btn status-completed';
            nameSpan.style.textDecoration = 'line-through';
            nameSpan.style.opacity = '0.6';
        } else {
            // To Do
            timeControlsDiv.style.display = 'block';
            countdownDisplay.style.display = 'none';
            statsBadge.style.display = 'none';
            statusBtn.textContent = 'Start';
            statusBtn.className = 'status-btn status-todo';
        }

        statusBtn.addEventListener('click', async () => {
            let acts = loadState();
            let a = acts[index];

            if (a.status === 'To Do' || !a.status) {
                let init = a.initialTime || a.time || 0;
                if (init <= 0) {
                    await showModal({
                        title: 'Wait a sec',
                        message: 'This activity has no valid time.',
                        type: 'alert'
                    });
                    return;
                }
                a.status = 'In Progress';
                a.endTime = Date.now() + init * 60000;
                a.extendedTime = 0;
                saveState(acts);
                renderActivities();
            } else if (a.status === 'In Progress' || a.status === 'Paused') {
                const confirmed = await showModal({
                    title: 'Complete Early?',
                    message: `Do you want to finish "${a.name}" early?`,
                    type: 'confirm'
                });
                
                if (confirmed) {
                    let remMs = a.status === 'Paused' ? a.remainingWhenPaused : (a.endTime - Date.now());
                    a.status = 'Completed';
                    
                    let initMins = a.initialTime || a.time || 0;
                    let extMins = a.extendedTime || 0;
                    let totalMsUsed = (initMins + extMins) * 60000 - remMs;
                    let minsUsed = Math.round(totalMsUsed / 60000);

                    if (minsUsed < initMins) {
                        a.savedTime = initMins - minsUsed;
                        a.extraTime = 0;
                    } else {
                        a.savedTime = 0;
                        a.extraTime = minsUsed - initMins;
                    }

                    saveState(acts);
                    renderActivities();
                }
            }
        });

        pauseBtn.addEventListener('click', async () => {
            const passed = await runMathChallenge();
            if (!passed) return;
            
            let acts = loadState();
            let a = acts[index];
            if (a.status === 'In Progress') {
                a.remainingWhenPaused = a.endTime - Date.now();
                a.status = 'Paused';
                saveState(acts);
                renderActivities();
            } else if (a.status === 'Paused') {
                a.endTime = Date.now() + a.remainingWhenPaused;
                a.status = 'In Progress';
                saveState(acts);
                renderActivities();
            }
        });

        extendBtn.addEventListener('click', async () => {
            const passed = await runMathChallenge();
            if (!passed) return;

            let acts = loadState();
            let a = acts[index];
            if (a.status === 'In Progress') {
                a.endTime += 5 * 60000;
                a.extendedTime = (a.extendedTime || 0) + 5;
                saveState(acts);
                syncDOM(); 
            } else if (a.status === 'Paused') {
                a.remainingWhenPaused += 5 * 60000;
                a.extendedTime = (a.extendedTime || 0) + 5;
                saveState(acts);
                syncDOM();
            }
        });

        // 6. DELETE BUTTON
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&#10005;';

        deleteBtn.addEventListener('click', async () => {
            const confirmed = await showModal({
                title: 'Delete Activity',
                message: `Are you sure you want to delete "${activity.name}"?`,
                type: 'confirm'
            });

            if(confirmed) {
                li.classList.add('deleting');
                setTimeout(() => {
                    const activities = loadState();
                    activities.splice(index, 1);
                    saveState(activities);
                    renderActivities();
                }, 300);
            }
        });

        // Append everything to controls wrapper
        activityControls.appendChild(timeControlsDiv);
        activityControls.appendChild(countdownDisplay);
        activityControls.appendChild(statsBadge);
        activityControls.appendChild(actionsDiv);
        activityControls.appendChild(statusBtn);
        activityControls.appendChild(deleteBtn);

        li.appendChild(nameSpan);
        li.appendChild(activityControls);

        return li;
    };

    const renderActivities = () => {
        clearAllIntervals();
        activityList.innerHTML = '';
        const activities = loadState();
        
        activities.forEach((activity, index) => {
            const li = createActivityElement(activity, index);
            activityList.appendChild(li);
        });
    };

    const addActivity = async () => {
        const name = newActivityInput.value.trim();
        const mins = parseInt(newActivityTime.value.trim());

        if (!name || isNaN(mins) || mins <= 0) {
            await showModal({
                title: 'Hold on',
                message: 'Please enter a valid task name and its time in minutes.',
                type: 'alert'
            });
            return;
        }

        const activities = loadState();
        const newActivity = { 
            name, 
            initialTime: mins,
            extendedTime: 0,
            status: 'To Do' 
        };
        activities.push(newActivity);
        saveState(activities);
        newActivityInput.value = '';
        newActivityTime.value = '';
        
        renderActivities();
    };

    addActivityBtn.addEventListener('click', addActivity);
    newActivityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addActivity();
    });
    newActivityTime.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addActivity();
    });

    prevDateBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDisplayDate();
        renderActivities();
    });

    nextDateBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDisplayDate();
        renderActivities();
    });

    // Export functionality
    exportBtn.addEventListener('click', () => {
        exportBtn.style.visibility = 'hidden';
        const inputSection = document.querySelector('.input-section');
        inputSection.style.display = 'none';
        
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => btn.style.display = 'none');

        const originalBg = mainContainer.style.background;
        mainContainer.style.background = '#1a2233'; 
        
        mainContainer.classList.remove('float-animation');
        mainContainer.style.transform = 'none';

        setTimeout(() => {
            html2canvas(mainContainer, {
                scale: 2,
                backgroundColor: null, 
                logging: false
            }).then(canvas => {
                exportBtn.style.visibility = 'visible';
                inputSection.style.display = 'flex';
                deleteBtns.forEach(btn => btn.style.display = 'flex');
                
                mainContainer.style.background = originalBg;
                mainContainer.classList.add('float-animation');

                const link = document.createElement('a');
                link.download = `Status_${formatDate(currentDate)}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }, 100);
    });

    // Initial render
    updateDisplayDate();
    renderActivities();
});
