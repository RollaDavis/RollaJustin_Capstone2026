<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class ProgramsSemestersSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/programs_semesters.csv';
        $this->delimiter = ',';
        $this->tablename = 'programs_semesters';
        $this->mapping = ['id','program_id', 'semester_id'];
    }

    /**
     * Run the database seeds.
     */
    public function run()   
    {
        parent::run();
    }
}
