<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class SemestersCoursesSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/semesters_courses.csv';
        $this->delimiter = ',';
        $this->tablename = 'semesters_courses';
        $this->mapping = ['id', 'programs_semesters_id', 'course_id'];
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        parent::run();
    }
}
