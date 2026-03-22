<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use JeroenZwart\CsvSeeder\CsvSeeder;

class SemesterSeeder extends CsvSeeder
{
    public function __construct()
    {
        $this->file = '/database/seeds/csvs/semesters.csv';
        $this->delimiter = ',';
        $this->tablename = 'semesters';
        $this->mapping = ['id', 'name'];
    }

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        parent::run();
    }
}

