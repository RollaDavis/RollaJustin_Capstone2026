<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class ProgramsAssignmentsSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/program_assignments.csv';
        $this->delimiter = ',';
        $this->tablename = 'program_assignments';
        $this->truncate = false;
        $this->mapping = ['id', 'program_id', 'term_id', 'course_id', 'year'];
    }

    /**
     * Run the database seeds.
     */
    public function run()   
    {
        parent::run();
    }
}
