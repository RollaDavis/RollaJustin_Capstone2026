<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

Auth::routes();

Route::get('/', function () {
    return view('auth.login');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
});

Route::post('/login/token', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'error' => ['The provided credentials are incorrect.'],
        ]);
    }

    $tokenText = $user->createToken($request->device_name)->plainTextToken;
    return ['token' => $tokenText];
});


if (config('app.debug')) {
    Route::get('/_debug-csrf', function (Request $request) {
        return response()->json([
            'app_debug' => config('app.debug'),
            'session_id' => session()->getId(),
            'csrf_token' => csrf_token(),
            'session_token' => $request->session()->token(),
            'cookies' => $request->cookies->all(),
            'headers' => $request->headers->all(),
        ]);
    });
}


