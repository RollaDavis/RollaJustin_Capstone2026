<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Termwind\Components\Raw;

use function Symfony\Component\Translation\t;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $personalUser = User::factory()->personalRolla()->create();
        $personalJustin = User::factory()->personalJustin()->create();

        $this->call([
            InstructorSeeder::class,
            LocationSeeder::class,
            RoomSeeder::class,
            CourseSeeder::class,
            SectionSeeder::class,
            TermSeeder::class,
            ProgramSeeder::class,
            TimeslotSeeder::class,
            ProgramsAssignmentsSeeder::class,
            InstructorsTimeslotsSeeder::class,
            RoomsTimeslotsSeeder::class,
            SectionsTimeslotsSeeder::class,
            RoomTimeBlockSeeder::class,
            InstructorTimeBlockSeeder::class,
            PossibilitiesSeeder::class,
            AssignmentsSeeder::class
        ]);
    }
}
