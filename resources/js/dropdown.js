import '../../resources/js/bootstrap';

document.addEventListener('DOMContentLoaded', () => {
    const scheduleBySelect = document.getElementById('scheduleBySelect');
    const scheduleByDropdownButton = document.getElementById('scheduleByDropdownButton');
    const scheduleByOptions = document.getElementById('scheduleByOptions');
    const scheduleValueSelect = document.getElementById('scheduleValueSelect');
    const scheduleValueDropdownButton = document.getElementById('scheduleValueDropdownButton');
    const scheduleValueSearch = document.getElementById('scheduleValueSearch');
    const scheduleValueOptions = document.getElementById('scheduleValueOptions');

    let scheduleValueOptionsData = [];
    let selectedTermId = null;
    let selectedTermName = null;

    const scheduleValueConfig = {
        instructor: {
            endpoint:(termId) => `/api/v1/terms/${termId}/instructors`,
            coursesEndpoint: (instructorId, termId) => `/api/v1/terms/${termId}/instructors/${instructorId}`,
            loadingMessage: 'Loading instructors...',
            selectMessage: 'Select an instructor',
            emptyMessage: 'No instructors found',
            searchPlaceholder: 'Search instructors',
            searchAriaLabel: 'Search instructors'
        },
        room: {
            endpoint:(termId) => `/api/v1/terms/${termId}/rooms`,
            coursesEndpoint: (roomId, termId) => `/api/v1/terms/${termId}/rooms/${roomId}`,
            loadingMessage: 'Loading rooms...',
            selectMessage: 'Select a room',
            emptyMessage: 'No rooms found',
            searchPlaceholder: 'Search rooms',
            searchAriaLabel: 'Search rooms'
        },
        program: {
            endpoint:(termId) => `/api/v1/terms/${termId}/programs`,
            coursesEndpoint:(termId, programId, year) => `/api/v1/terms/${termId}/programs/${programId}/${year}`,
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

    const extractYearFromLabel = (label = '') => {
        const match = String(label).match(/\bYear\s+(\d+)\b/i);
        return match ? Number(match[1]) : null;
    };

    const fetchCoursesForSelection = async (selectedView, selectedId, selectedName, selectedOption = null) => {
        const selectedConfig = scheduleValueConfig[selectedView];

        if (!selectedConfig?.coursesEndpoint) {
            return;
        }

        try {
            let endpoint = '';

            if (selectedView === 'program') {
                const selectedYear = selectedOption?.year ?? extractYearFromLabel(selectedName);

                if (!selectedTermId || !selectedId || selectedYear === null) {
                    publishSelectedCourses(selectedView, selectedId, selectedName, []);
                    return;
                }

                endpoint = selectedConfig.coursesEndpoint(selectedTermId, selectedId, selectedYear);
            } else {
                endpoint = selectedConfig.coursesEndpoint(selectedId, selectedTermId);
            }

            if (!endpoint) {
                publishSelectedCourses(selectedView, selectedId, selectedName, []);
                return;
            }

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Failed to load ${selectedView} courses: ${response.status}`);
            }

            const payload = await response.json();
            const courses = Array.isArray(payload)
                ? payload
                : (Array.isArray(payload?.data) ? payload.data : []);

            console.log(`Courses for ${selectedView} ${selectedName} (ID: ${selectedId}) in term ${selectedTermName}`, courses);
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

                fetchCoursesForSelection(selectedView, option.id, option.name, option);
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
        const endpoint = typeof selectedConfig?.endpoint === 'function'
            ? selectedConfig.endpoint(selectedTermId)
            : selectedConfig?.endpoint;

        if (!selectedConfig) {
            scheduleValueOptionsData = [];
            setScheduleValueSearchLabels();
            resetSecondarySelector('Select an option');
            return;
        }

        if (!endpoint) {
            scheduleValueOptionsData = [];
            setScheduleValueSearchLabels(selectedConfig.searchPlaceholder, selectedConfig.searchAriaLabel);
            resetSecondarySelector('Select a term first');
            return;
        }

        setScheduleValueSearchLabels(selectedConfig.searchPlaceholder, selectedConfig.searchAriaLabel);
        resetSecondarySelector(selectedConfig.loadingMessage);

        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Failed to load ${normalizedView} options: ${response.status}`);
            }

            const payload = await response.json();
            const options = Array.isArray(payload)
                ? payload
                : (Array.isArray(payload?.data) ? payload.data : []);

            scheduleValueOptionsData = options
                .map((option) => {
                    if (!option || option.id === undefined) {
                        return null;
                    }

                    const optionName = option.name ?? option.attributes?.name;

                    if (!optionName) {
                        return null;
                    }

                    let displayName = String(optionName);
                    const year = option.year ?? option.attributes?.year;
                    if (year) {
                        displayName = `${displayName} - Year ${year}`;
                    }

                    return {
                        id: option.id,
                        name: displayName,
                        year: year ?? null
                    };
                })
                .filter((option) => option !== null);

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

    const termDropdownButton = document.getElementById('termDropdownButton');
    const termOptions = document.getElementById('termOptions');

    if (termDropdownButton && termOptions) {
        if (scheduleByDropdownButton) {
            scheduleByDropdownButton.disabled = true;
        }
        if (scheduleValueDropdownButton) {
            scheduleValueDropdownButton.disabled = true;
        }

        const fetchTerms = async () => {
            try {
                const response = await fetch('/api/v1/terms');

                if (!response.ok) {
                    throw new Error(`Failed to load terms: ${response.status}`);
                }

                const terms = await response.json();

                termOptions.innerHTML = '';

                if (Array.isArray(terms) && terms.length > 0) {
                    terms.forEach((term) => {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'dropdown-item';
                        button.textContent = term.name;
                        button.addEventListener('click', () => {
                            selectedTermId = term.id;
                            selectedTermName = term.name;
                            termDropdownButton.textContent = term.name;
                            termDropdownButton.dataset.termId = String(term.id);

                            document.dispatchEvent(new CustomEvent('schedule:term-selected', {
                                detail: {
                                    termId: term.id,
                                    termName: term.name
                                }
                            }));

                            const selectedView = normalizeScheduleByValue(scheduleBySelect?.value || '');

                            if (scheduleValueConfig[selectedView]) {
                                populateScheduleValueOptions(selectedView);
                            }
                            
                            if (scheduleByDropdownButton) {
                                scheduleByDropdownButton.disabled = false;
                            }

                            if (scheduleValueSelect && scheduleValueSelect.value) {
                                const selectedId = parseInt(scheduleValueSelect.value, 10);
                                const selectedName = scheduleValueDropdownButton?.textContent || '';
                                
                                if (selectedView && selectedId && selectedName) {
                                    fetchCoursesForSelection(selectedView, selectedId, selectedName);
                                }
                            }
                        });

                        termOptions.appendChild(button);
                    });
                } else {
                    const emptyMessage = document.createElement('span');
                    emptyMessage.className = 'dropdown-item-text text-muted small';
                    emptyMessage.textContent = 'No terms available';
                    termOptions.appendChild(emptyMessage);
                }
            } catch (error) {
                console.error('Error fetching terms:', error);
                termOptions.innerHTML = '<span class="dropdown-item-text text-muted small">Unable to load terms</span>';
            }
        };

        termDropdownButton.addEventListener('shown.bs.dropdown', fetchTerms);

        fetchTerms();
    }
});
