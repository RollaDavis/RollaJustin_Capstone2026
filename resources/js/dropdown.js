import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
    const scheduleBySelect = document.getElementById('scheduleBySelect');
    const scheduleByDropdownButton = document.getElementById('scheduleByDropdownButton');
    const scheduleByOptions = document.getElementById('scheduleByOptions');
    const scheduleValueSelect = document.getElementById('scheduleValueSelect');
    const scheduleValueDropdownButton = document.getElementById('scheduleValueDropdownButton');
    const scheduleValueSearch = document.getElementById('scheduleValueSearch');
    const scheduleValueOptions = document.getElementById('scheduleValueOptions');

    let instructorOptions = [];

    const setDropdownLabel = (text = 'Select an option') => {
        if (!scheduleValueDropdownButton) {
            return;
        }

        scheduleValueDropdownButton.textContent = text;
    };

    const setDropdownMessage = (text) => {
        if (!scheduleValueOptions) {
            return;
        }

        scheduleValueOptions.innerHTML = '';

        const message = document.createElement('span');
        message.className = 'dropdown-item-text text-muted small';
        message.textContent = text;
        scheduleValueOptions.appendChild(message);
    };

    const setScheduleByLabel = (value) => {
        if (!scheduleByDropdownButton) {
            return;
        }

        const labels = {
            instructor: 'Instructor',
            room: 'Room',
            program: 'Program'
        };

        scheduleByDropdownButton.textContent = labels[value] || 'Select view';
    };

    const renderInstructorOptions = (searchTerm = '') => {
        if (!scheduleValueOptions) {
            return;
        }

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filteredOptions = instructorOptions.filter((instructor) => {
            return instructor.name.toLowerCase().includes(normalizedSearch);
        });

        scheduleValueOptions.innerHTML = '';

        if (filteredOptions.length === 0) {
            setDropdownMessage('No instructors found');
            return;
        }

        filteredOptions.forEach((instructor) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'dropdown-item';
            item.textContent = instructor.name;
            item.addEventListener('click', () => {
                if (scheduleValueSelect) {
                    scheduleValueSelect.value = String(instructor.id);
                }

                setDropdownLabel(instructor.name);
            });

            scheduleValueOptions.appendChild(item);
        });
    };

    const resetSecondarySelector = (label = 'Select an option') => {
        if (scheduleValueSelect) {
            scheduleValueSelect.value = '';
        }

        if (scheduleValueSearch) {
            scheduleValueSearch.value = '';
            scheduleValueSearch.disabled = true;
        }

        if (scheduleValueDropdownButton) {
            scheduleValueDropdownButton.disabled = true;
        }

        setDropdownLabel(label);
        setDropdownMessage(label);
    };

    const enableSecondarySelector = (label = 'Select an instructor') => {
        if (scheduleValueSearch) {
            scheduleValueSearch.disabled = false;
        }

        if (scheduleValueDropdownButton) {
            scheduleValueDropdownButton.disabled = false;
        }

        setDropdownLabel(label);
    };

    const populateInstructorOptions = async () => {
        if (!scheduleValueSelect || !scheduleValueOptions) {
            return;
        }

        resetSecondarySelector('Loading instructors...');

        try {
            const response = await fetch('/api/instructors');

            if (!response.ok) {
                throw new Error(`Failed to load instructors: ${response.status}`);
            }

            const instructors = await response.json();

            instructorOptions = instructors
                .filter((instructor) => instructor && instructor.id !== undefined && instructor.name)
                .map((instructor) => ({
                    id: instructor.id,
                    name: String(instructor.name)
                }));

            enableSecondarySelector('Select an instructor');
            renderInstructorOptions();
        } catch (error) {
            console.error(error);
            instructorOptions = [];
            resetSecondarySelector('Unable to load instructors');
        }
    };

    if (scheduleBySelect && scheduleByOptions) {
        scheduleByOptions.querySelectorAll('[data-schedule-by-value]').forEach((optionButton) => {
            optionButton.addEventListener('click', () => {
                const selectedValue = optionButton.getAttribute('data-schedule-by-value') || '';

                if (!selectedValue) {
                    return;
                }

                scheduleBySelect.value = selectedValue;
                setScheduleByLabel(selectedValue);
                scheduleBySelect.dispatchEvent(new Event('change'));
            });
        });

        setScheduleByLabel(scheduleBySelect.value);
    }

    if (scheduleBySelect && scheduleValueSelect && scheduleValueDropdownButton && scheduleValueSearch && scheduleValueOptions) {
        scheduleValueSearch.addEventListener('input', () => {
            renderInstructorOptions(scheduleValueSearch.value);
        });

        scheduleBySelect.addEventListener('change', () => {
            const selectedView = scheduleBySelect.value;

            if (selectedView === 'instructor' || selectedView === 'instructors') {
                populateInstructorOptions();
                return;
            }

            instructorOptions = [];
            resetSecondarySelector('Select an option');
        });

        if (scheduleBySelect.value === 'instructor' || scheduleBySelect.value === 'instructors') {
            populateInstructorOptions();
        } else {
            resetSecondarySelector('Select an option');
        }
    }
});
