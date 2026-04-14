<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'Capstone') }}</title>

    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">


    <!-- Scripts -->
    @vite(['resources/sass/app.scss', 'resources/css/light-mode.css', 'resources/css/dark-mode.css', 'resources/js/app.js', 'resources/js/dropdown.js', 'resources/js/event-context-menu.js'])
    <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css' rel='stylesheet'>
    <link href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css' rel='stylesheet'>
</head>

<body class="min-vh-100">
    <div id="app" class="min-vh-100 d-flex flex-column">
        <nav class="navbar navbar-expand-md navbar-light bg-white shadow-sm">
            <div class="{{ request()->routeIs('home') ? 'container-fluid px-3' : 'container' }}">
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                    aria-expanded="false" aria-label="{{ __('Toggle navigation') }}">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <!-- Left Side Of Navbar -->
                    <ul class="navbar-nav me-auto {{ request()->routeIs('home') ? 'ps-0' : '' }}">
                        @auth
                            @if (request()->routeIs('home'))
                                <li class="nav-item d-flex align-items-center gap-4 my-2 my-md-0">
                                    <span class="navbar-text fw-semibold fs-6">View Schedule By:</span>
                                    <input id="scheduleBySelect" type="hidden" value="">

                                    <div class="dropdown">
                                        <button id="termDropdownButton" class="btn btn-outline-secondary dropdown-toggle"
                                            type="button" data-bs-toggle="dropdown" data-bs-auto-close="true"
                                            aria-expanded="false">
                                            Select a term
                                        </button>
                                        <div id="termOptions" class="dropdown-menu p-1 dropdown-term-options"></div>
                                    </div>

                                    <div class="dropdown">
                                        <button id="scheduleByDropdownButton" class="btn btn-outline-secondary dropdown-toggle"
                                            type="button" data-bs-toggle="dropdown" data-bs-auto-close="true"
                                            aria-expanded="false">
                                            Select an option
                                        </button>
                                        <div id="scheduleByOptions" class="dropdown-menu p-1 dropdown-schedule-by-options">
                                            <button type="button" class="dropdown-item"
                                                data-schedule-by-value="instructor">Instructor</button>
                                            <button type="button" class="dropdown-item"
                                                data-schedule-by-value="room">Room</button>
                                            <button type="button" class="dropdown-item"
                                                data-schedule-by-value="program">Program</button>
                                        </div>
                                    </div>
                                    <input id="scheduleValueSelect" type="hidden" value="">

                                    <div class="dropdown">
                                        <button id="scheduleValueDropdownButton"
                                            class="btn btn-outline-secondary dropdown-toggle" type="button"
                                            data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                            Select an option
                                        </button>
                                        <div id="scheduleValueDropdownMenu" class="dropdown-menu p-2 dropdown-schedule-value-menu">
                                            <input id="scheduleValueSearch" type="search" class="form-control mb-2"
                                                placeholder="Search instructors" aria-label="Search instructors">
                                            <div id="scheduleValueOptions" class="d-flex flex-column dropdown-schedule-value-options"></div>
                                        </div>
                                    </div>

                                </li>
                            @endif
                        @endauth
                    </ul>

                    <!-- Right Side Of Navbar -->
                    <ul class="navbar-nav ms-auto">
                        <!-- Authentication Links -->
                        @guest
                            @if (Route::has('login'))
                                <li class="nav-item">
                                    <a class="nav-link" href="{{ route('login') }}">{{ __('Login') }}</a>
                                </li>
                            @endif

                            @if (Route::has('register'))
                                <li class="nav-item">
                                    <a class="nav-link" href="{{ route('register') }}">{{ __('Register') }}</a>
                                </li>
                            @endif
                        @else
                            <li class="nav-item dropdown">
                                <a id="navbarDropdown" class="nav-link dropdown-toggle" href="#" role="button"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" v-pre>
                                    {{ Auth::user()->name }}
                                </a>

                                <div class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                                    <a class="dropdown-item" href="{{ route('logout') }}" onclick="event.preventDefault();
                                                                         document.getElementById('logout-form').submit();">
                                        {{ __('Logout') }}
                                    </a>
                                    <form id="logout-form" action="{{ route('logout') }}" method="POST" class="d-none">
                                        @csrf
                                    </form>
                                </div>
                            </li>
                        @endguest
                    </ul>
                </div>
            </div>
        </nav>

        <main class="{{ request()->routeIs('home') ? 'flex-grow-1 d-flex flex-column' : 'py-4' }}">
            @yield('content')
        </main>
    </div>
</body>

</html>