import { Controller, Get, Query } from '@nestjs/common';
import { CollegeScorecardService } from './college-scorecard.service';

@Controller('college-scorecard')
export class CollegeScorecardController {
  constructor(private readonly service: CollegeScorecardService) {}

  @Get('cities')
  async getCities(@Query('state') state: string) {
    const stateParam = state || '';
    console.log('[CollegeScorecard] getCities requested, state=', JSON.stringify(stateParam));
    const result = await this.service.getCitiesByState(stateParam);
    console.log('[CollegeScorecard] getCities result:', Array.isArray(result) ? `${result.length} cities` : JSON.stringify(result));
    return result;
  }

  @Get('institutions')
  async getInstitutions(
    @Query('state') state: string,
    @Query('city') city: string,
  ) {
    return this.service.getInstitutionsByStateCity(state || '', city || '');
  }

  @Get('programs')
  async getPrograms(@Query('schoolId') schoolId: string) {
    const id = parseInt(schoolId || '0', 10);
    return this.service.getProgramsBySchoolId(id);
  }

  @Get('programs-cip4')
  async getProgramsCip4(@Query('schoolId') schoolId: string) {
    const id = parseInt(schoolId || '0', 10);
    return this.service.getProgramsCip4BySchoolId(id);
  }

  @Get('cip6-options')
  getCip6Options(@Query('cip4') cip4: string) {
    return this.service.getCip6OptionsForCip4(cip4 || '');
  }
}
