import './bootstrap';

document.addEventListener('DOMContentLoaded', () => {
    const scheduleBySelect = document.getElementById('scheduleBySelect');
    const scheduleByDropdownButton = document.getElementById('scheduleByDropdownButton');
    const scheduleByOptions = document.getElementById('scheduleByOptions');
    const scheduleValueSelect = document.getElementById('scheduleValueSelect');
    const scheduleValueDropdownButton = document.getElementById('scheduleValueDropdownButton');
    const scheduleValueSearch = document.getElementById('scheduleValueSearch');
    const scheduleValueOptions = document.getElementById('scheduleValueOptions');

    let scheduleValueOptionsData = [];

    const scheduleValueConfig = {
        instructor: {
            endpoint: '/api/instructors',
            coursesEndpoint: (id) => `/api/instructors/${id}/courses`,
            loadingMessage: 'Loading instructors...',
            selectMessage: 'Select an instructor',
            emptyMessage: 'No instructors found',
            searchPlaceholder: 'Search instructors',
            searchAriaLabel: 'Search instructors'
        },
        room: {
            endpoint: '/api/rooms',
            coursesEndpoint: (id) => `/api/rooms/${id}/courses`,
            loadingMessage: 'Loading rooms...',
            selectMessage: 'Select a room',
            emptyMessage: 'No rooms found',
            searchPlaceholder: 'Search rooms',
            searchAriaLabel: 'Search rooms'
        },
        program: {
            endpoint: '/api/programs',
            coursesEndpoint: (id) => `/api/programs/${id}/courses`,
            loadingMessage: 'Loading programs...',
            selectMessage: 'Select a program',
            emptyMessage: 'No programs found',
            searchPlaceholder: 'Search programs',
            searchAriaLabel: 'Search programs'
        }
    };

    const normalizeScheduleByValue = (value) => {
        if (value === 'instructors') {
            return 'instructor';
        }

        if (value === 'rooms') {
            return 'room';
        }

        return value;
    };

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

        const normalizedValue = normalizeScheduleByValue(value);

        const labels = {
            instructor: 'Instructor',
            room: 'Room',
            program: 'Program'
        };

        scheduleByDropdownButton.textContent = labels[normalizedValue] || 'Select an option';
    };

    const setScheduleValueSearchLabels = (placeholder = 'Search options', ariaLabel = 'Search options') => {
        if (!scheduleValueSearch) {
            return;
        }

        scheduleValueSearch.placeholder = placeholder;
        scheduleValueSearch.setAttribute('aria-label', ariaLabel);
    };

    const publishSelectedCourses = (selectedView, selectedId, selectedName, courses) => {
        document.dispatchEvent(new CustomEvent('schedule:courses-selected', {
            detail: {
                selectedView,
                selectedId,
                selectedName,
                courses
            }
        }));
    };

    const fetchCoursesForSelection = async (selectedView, selectedId, selectedName) => {
        const selectedConfig = scheduleValueConfig[selectedView];

        if (!selectedConfig?.coursesEndpoint) {
            return;
        }

        try {
            const response = await fetch(selectedConfig.coursesEndpoint(selectedId));

            if (!response.ok) {
                throw new Error(`Failed to load ${selectedView} courses: ${response.status}`);
            }

            const courses = await response.json();

            console.log(`Courses for ${selectedView} ${selectedName} (ID: ${selectedId})`, courses);
            publishSelectedCourses(selectedView, selectedId, selectedName, courses);
        } catch (error) {
            console.error(`Unable to load courses for ${selectedView}`, error);
            publishSelectedCourses(selectedView, selectedId, selectedName, []);
        }
    };

    const closeSecondaryDropdown = () => {
        if (!scheduleValueDropdownButton) {
            return;
        }

        if (scheduleValueDropdownButton.getAttribute('aria-expanded') === 'true') {
            scheduleValueDropdownButton.click();
        }
    };

    const openSecondaryDropdown = () => {
        if (!scheduleValueDropdownButton || scheduleValueDropdownButton.disabled) {
            return;
        }

        if (scheduleValueDropdownButton.getAttribute('aria-expanded') !== 'true') {
            scheduleValueDropdownButton.click();
        }
    };

    const renderScheduleValueOptions = (searchTerm = '') => {
        if (!scheduleValueOptions) {
            return;
        }

        const selectedView = normalizeScheduleByValue(scheduleBySelect?.value || '');
        const selectedConfig = scheduleValueConfig[selectedView];

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filteredOptions = scheduleValueOptionsData.filter((option) => {
            return option.name.toLowerCase().includes(normalizedSearch);
        });

        scheduleValueOptions.innerHTML = '';

        if (filteredOptions.length === 0) {
            setDropdownMessage(selectedConfig?.emptyMessage || 'No options found');
            return;
        }

        filteredOptions.forEach((option) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'dropdown-item';
            item.textContent = option.name;
            item.addEventListener('click', () => {
                const selectedView = normalizeScheduleByValue(scheduleBySelect?.value || '');

                if (scheduleValueSelect) {
                    scheduleValueSelect.value = String(option.id);
                }

                setDropdownLabel(option.name);
                closeSecondaryDropdown();

                fetchCoursesForSelection(selectedView, option.id, option.name);
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

    const enableSecondarySelector = (label = 'Select an option') => {
        if (scheduleValueSearch) {
            scheduleValueSearch.disabled = false;
        }

        if (scheduleValueDropdownButton) {
            scheduleValueDropdownButton.disabled = false;
        }

        setDropdownLabel(label);
    };

    const populateScheduleValueOptions = async (selectedView, autoOpen = false) => {
        if (!scheduleValueSelect || !scheduleValueOptions) {
            return;
        }

        const normalizedView = normalizeScheduleByValue(selectedView);
        const selectedConfig = scheduleValueConfig[normalizedView];

        if (!selectedConfig) {
            scheduleValueOptionsData = [];
            setScheduleValueSearchLabels();
            resetSecondarySelector('Select an option');
            return;
        }

        setScheduleValueSearchLabels(selectedConfig.searchPlaceholder, selectedConfig.searchAriaLabel);
        resetSecondarySelector(selectedConfig.loadingMessage);

        try {
            const response = await fetch(selectedConfig.endpoint);

            if (!response.ok) {
                throw new Error(`Failed to load ${normalizedView} options: ${response.status}`);
            }

            const options = await response.json();

            scheduleValueOptionsData = options
                .filter((option) => option && option.id !== undefined && option.name)
                .map((option) => ({
                    id: option.id,
                    name: String(option.name)
                }));

            enableSecondarySelector(selectedConfig.selectMessage);
            renderScheduleValueOptions();

            if (autoOpen) {
                openSecondaryDropdown();
            }
        } catch (error) {
            console.error(error);
            scheduleValueOptionsData = [];
            resetSecondarySelector('Unable to load options');
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
            renderScheduleValueOptions(scheduleValueSearch.value);
        });

        scheduleBySelect.addEventListener('change', () => {
            const selectedView = normalizeScheduleByValue(scheduleBySelect.value);

            if (scheduleValueConfig[selectedView]) {
                populateScheduleValueOptions(selectedView, true);
                return;
            }

            scheduleValueOptionsData = [];
            setScheduleValueSearchLabels();
            resetSecondarySelector('Select an option');
            publishSelectedCourses('', null, '', []);
        });

        const initialView = normalizeScheduleByValue(scheduleBySelect.value);

        if (scheduleValueConfig[initialView]) {
            populateScheduleValueOptions(initialView);
        } else {
            scheduleValueOptionsData = [];
            setScheduleValueSearchLabels();
            resetSecondarySelector('Select an option');
        }
    }
});
