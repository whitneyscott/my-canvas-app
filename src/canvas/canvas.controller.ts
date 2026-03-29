import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { CanvasService } from './canvas.service';
@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get('courses')
  async getCourses() {
    try {
      return await this.canvasService.getCourses();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/no canvas token|unauthorized: no canvas/i.test(msg)) {
        throw new HttpException(msg, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
    }
  }

  @Get('courses/:id')
  async getCourseDetails(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseDetails(id);
  }

  @Get('courses/:id/students')
  async getCourseStudents(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseStudents(id);
  }

  @Get('courses/:id/quizzes')
  async getCourseQuizzes(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`[Controller] Getting quizzes for course ${id}`);
      const result = await this.canvasService.getCourseQuizzes(id);
      console.log(
        `[Controller] Successfully retrieved ${result.length} quizzes`,
      );
      return result;
    } catch (error: any) {
      console.error(
        `[Controller] Error getting quizzes for course ${id}:`,
        error,
      );
      console.error(`[Controller] Error message:`, error.message);
      console.error(`[Controller] Error stack:`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to load quizzes: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('courses/:id/assignments')
  async getCourseAssignments(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAssignments(id);
  }

  @Get('courses/:id/new_quizzes')
  async getCourseNewQuizzes(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.canvasService.getCourseNewQuizzes(id);
    } catch (error: any) {
      throw new HttpException(
        {
          message: error.message || 'Failed to load New Quizzes',
          error: String(error?.message || error),
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('courses/:id/assignment_groups')
  async getCourseAssignmentGroups(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAssignmentGroups(id);
  }

  @Get('courses/:id/rubrics')
  async getCourseRubrics(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseRubrics(id);
  }

  @Post('courses/:id/rubrics')
  async createCourseRubric(
    @Param('id', ParseIntPipe) courseId: number,
    @Body()
    body: {
      title?: string;
      association_id?: number;
      association_type?: string;
    },
  ) {
    return this.canvasService.createCourseRubric(courseId, body || {});
  }

  @Post('courses/:id/assignment_groups')
  async createAssignmentGroup(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() body: { name: string; group_weight?: number },
  ) {
    return this.canvasService.createAssignmentGroup(
      courseId,
      body.name,
      body.group_weight,
    );
  }

  @Put('courses/:courseId/assignment_groups/:id')
  async updateAssignmentGroup(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: { name?: string; group_weight?: number },
  ) {
    return this.canvasService.updateAssignmentGroup(courseId, id, updates);
  }

  @Delete('courses/:courseId/assignment_groups/:id')
  async deleteAssignmentGroup(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteAssignmentGroup(courseId, id);
  }

  @Get('courses/:id/discussions')
  async getCourseDiscussions(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseDiscussions(id);
  }

  @Get('courses/:id/pages')
  async getCoursePages(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCoursePages(id);
  }

  @Get('courses/:id/announcements')
  async getCourseAnnouncements(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAnnouncements(id);
  }

  @Get('courses/:id/modules')
  async getCourseModules(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseModules(id);
  }

  @Get('courses/:id/files')
  async getCourseFiles(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseFiles(id);
  }

  @Get('courses/:id/accommodations')
  async getCourseAccommodations(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAccommodations(id);
  }

  @Get('courses/:id/accommodations/ensure-columns')
  async ensureAccommodationColumns(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.ensureAccommodationColumns(id);
  }

  @Get('courses/:id/accommodations/data')
  async getAccommodationData(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getAccommodationData(id);
  }

  @Put('courses/:courseId/accommodations/columns/:columnId/users/:userId')
  async saveAccommodationValue(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('columnId', ParseIntPipe) columnId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { content: string },
  ) {
    return this.canvasService.saveAccommodationValue(
      courseId,
      columnId,
      userId,
      body.content,
    );
  }

  @Get('courses/:id/custom_gradebook_columns')
  async getCustomGradebookColumns(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCustomGradebookColumns(id);
  }

  @Get('courses/:id/accreditation/profile')
  async getAccreditationProfile(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getAccreditationProfile(id);
  }

  @Put('courses/:id/accreditation/profile')
  async saveAccreditationProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { profile: Record<string, unknown> },
  ) {
    return this.canvasService.saveAccreditationProfile(id, body.profile);
  }

  @Get('courses/:id/accreditation/accreditors')
  async getAccreditors(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
    @Query('degree_level') degreeLevel: string,
  ) {
    return this.canvasService.getAccreditorsForCourse(
      id,
      cip || undefined,
      degreeLevel || undefined,
    );
  }

  @Post('courses/:id/accreditation/standards/suggest')
  async suggestStandards(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { n?: number },
  ) {
    return this.canvasService.suggestAdditionalStandardsForCourse(
      id,
      body?.n ?? 5,
    );
  }

  @Post('courses/:id/accreditation/standards/finalize')
  async finalizeStandards(@Param('id', ParseIntPipe) id: number) {
    await this.canvasService.setAccreditationStageState(id, '1', 'approved');
    await this.canvasService.logAccreditationOperation(
      id,
      'standards_finalized',
      '1',
      {},
    );
    return { success: true };
  }

  @Post('courses/:id/accreditation/standards/ai-action')
  async applyAiSuggestionAction(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { standardId: string; action: 'accept' | 'reject' | 'review_later' },
  ) {
    return this.canvasService.applyAiSuggestionAction(
      id,
      body.standardId,
      body.action,
    );
  }

  @Get('courses/:id/accreditation/standards')
  async getAccreditationStandards(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
    @Query('degree_level') degreeLevel: string,
  ): Promise<any> {
    return this.canvasService.getAccreditationStandardsForCourse(
      id,
      cip || undefined,
      degreeLevel || undefined,
    );
  }

  @Get('courses/:id/accreditation/outcomes')
  async getCourseOutcomeLinks(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseOutcomeLinks(id);
  }

  @Get('courses/:id/accreditation/outcomes/preview')
  async getOutcomesPreview(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
    @Query('degree_level') degreeLevel: string,
  ) {
    return this.canvasService.getOutcomesPreviewByOrg(
      id,
      cip || undefined,
      degreeLevel || undefined,
    );
  }

  @Post('courses/:id/accreditation/outcomes/sync-org')
  async syncOutcomesForOrg(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      orgId: string;
      orgAbbrev: string;
      orgName: string;
      cip?: string;
      selectedStandardIds?: string[];
    },
  ) {
    try {
      return await this.canvasService.syncOutcomesForOrg(
        id,
        body.orgId,
        body.orgAbbrev || body.orgId,
        body.orgName || body.orgId,
        body.cip,
        undefined,
        body.selectedStandardIds,
      );
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error(
        '[sync-org]',
        id,
        body.orgAbbrev || body.orgId,
        msg,
        e?.stack,
      );
      throw new HttpException(msg, 500);
    }
  }

  @Post('courses/:id/accreditation/outcomes/sync')
  async syncCourseOutcomesFromStandards(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { cip?: string; degree_level?: string; include_groups?: boolean },
  ) {
    return this.canvasService.syncCourseOutcomesFromSelectedStandards(
      id,
      body?.cip,
      body?.degree_level,
      !!body?.include_groups,
    );
  }

  @Get('courses/:id/accreditation/workflow')
  async getAccreditationWorkflow(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getAccreditationWorkflow(id);
  }

  @Get('courses/:id/accreditation/instruction-alignment')
  async getInstructionAlignment(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
  ) {
    return this.canvasService.getInstructionAlignmentSuggestions(
      id,
      cip || undefined,
    );
  }

  @Post('courses/:id/accreditation/rubrics/create')
  async createRubricForResource(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      resource_type: string;
      resource_id: string;
      criteria: Array<{
        description: string;
        outcome_id?: number;
        points?: number;
      }>;
    },
  ) {
    return this.canvasService.createRubricForResource(
      id,
      body.resource_type,
      body.resource_id,
      body.criteria ?? [],
    );
  }

  @Post('courses/:id/accreditation/tagging/resource')
  async applyResourceTagging(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      resource_type: string;
      resource_id: string;
      standards: Array<{ id: string; title: string; org?: string }>;
    },
  ) {
    return this.canvasService.applyResourceTagging(
      id,
      body.resource_type,
      body.resource_id,
      body.standards ?? [],
    );
  }

  @Post('courses/:id/accreditation/tagging/quiz')
  async applyQuizTagging(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      quiz_id: number;
      standards: Array<{ id: string; title: string; org?: string }>;
    },
  ) {
    return this.canvasService.applyQuizTagging(
      id,
      body.quiz_id,
      body.standards ?? [],
    );
  }

  @Post('courses/:id/accreditation/tagging/new-quiz')
  async applyNewQuizTagging(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      assignment_id: number;
      standards: Array<{ id: string; title: string; org?: string }>;
    },
  ) {
    return this.canvasService.applyNewQuizTagging(
      id,
      body.assignment_id,
      body.standards ?? [],
    );
  }

  @Get('courses/:id/accreditation/alignment')
  async getAccreditationAlignment(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
    @Query('degree_level') degreeLevel: string,
  ) {
    return this.canvasService.getAccreditationAlignment(
      id,
      cip || undefined,
      degreeLevel || undefined,
    );
  }

  @Get('courses/:id/accreditation/canvas-outcome-alignments')
  async getCanvasOutcomeAlignments(
    @Param('id', ParseIntPipe) id: number,
    @Query('assignment_id') assignmentIdRaw?: string,
  ) {
    const assignmentId =
      assignmentIdRaw != null && assignmentIdRaw !== ''
        ? Number(assignmentIdRaw)
        : undefined;
    return this.canvasService.getCanvasOutcomeAlignments(
      id,
      Number.isFinite(assignmentId) ? assignmentId : undefined,
    );
  }

  @Get('courses/:id/accreditation/alignment-merge-preview')
  async getAccreditationAlignmentMergePreview(
    @Param('id', ParseIntPipe) id: number,
    @Query('cip') cip: string,
    @Query('degree_level') degreeLevel: string,
  ) {
    return this.canvasService.getAccreditationAlignmentMergePreview(
      id,
      cip || undefined,
      degreeLevel || undefined,
    );
  }

  @Get('courses/:id/accreditation/outcome-evidence')
  async getAccreditationOutcomeEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Query('outcome_ids') outcomeIdsRaw?: string,
  ) {
    const outcomeIds =
      outcomeIdsRaw != null && outcomeIdsRaw !== ''
        ? outcomeIdsRaw
            .split(',')
            .map((x) => Number(x.trim()))
            .filter((n) => Number.isFinite(n))
        : undefined;
    const rollups = await this.canvasService.getCourseOutcomeRollupsCourseAggregate(
      id,
      outcomeIds?.length ? outcomeIds : undefined,
    );
    return {
      aggregate: 'course',
      ferpa: {
        student_level_rows: false,
        contributing_scores_require_user_ids: true,
      },
      ...rollups,
    };
  }

  @Get('courses/:id/accreditation/outcomes/:outcomeId/contributing-scores')
  async getAccreditationContributingScores(
    @Param('id', ParseIntPipe) id: number,
    @Param('outcomeId', ParseIntPipe) outcomeId: number,
    @Query('user_ids') userIdsRaw?: string,
  ) {
    const userIds =
      userIdsRaw != null && userIdsRaw !== ''
        ? userIdsRaw
            .split(',')
            .map((x) => Number(x.trim()))
            .filter((n) => Number.isFinite(n))
        : [];
    return this.canvasService.getOutcomeContributingScores(
      id,
      outcomeId,
      userIds.length ? userIds : undefined,
    );
  }

  @Get('courses/:id/accessibility/scan')
  async getAccessibilityScan(
    @Param('id', ParseIntPipe) id: number,
    @Query('baseline_ms') baselineMsRaw?: string,
    @Query('resource_types') resourceTypesRaw?: string,
    @Query('rule_ids') ruleIdsRaw?: string,
  ): Promise<any> {
    const baselineMs =
      baselineMsRaw != null && baselineMsRaw !== ''
        ? Number(baselineMsRaw)
        : undefined;
    const resourceTypes = (resourceTypesRaw || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const ruleIds = (ruleIdsRaw || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return this.canvasService.getAccessibilityScan(id, {
      canvasNativeBaselineMs: Number.isFinite(baselineMs)
        ? baselineMs
        : undefined,
      resourceTypes: resourceTypes.length ? resourceTypes : undefined,
      ruleIds: ruleIds.length ? ruleIds : undefined,
    });
  }

  @Post('courses/:id/accessibility/evaluate-html')
  async postAccessibilityEvaluateHtml(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      html?: string;
      rule_ids?: string[];
      resource_type: string;
      resource_id: string;
      resource_title?: string;
      resource_url?: string | null;
      refetch?: boolean;
    },
  ): Promise<any> {
    return this.canvasService.evaluateAccessibilityHtml(id, body);
  }

  @Post('courses/:id/accessibility/fix-preview')
  async getAccessibilityFixPreview(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      findings?: Array<{
        resource_type: string;
        resource_id: string;
        resource_title?: string;
        rule_id: string;
        snippet?: string | null;
      }>;
      preview_session_id?: string;
    },
  ) {
    const findings = Array.isArray(body?.findings) ? body.findings : [];
    const sid =
      typeof body?.preview_session_id === 'string'
        ? body.preview_session_id
        : undefined;
    return this.canvasService.getAccessibilityFixPreview(id, findings, sid);
  }

  @Post('courses/:id/accessibility/fix-preview-item')
  async getAccessibilityFixPreviewItem(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      finding?: {
        resource_type: string;
        resource_id: string;
        resource_title?: string;
        rule_id: string;
        snippet?: string | null;
      };
      preview_session_id?: string;
    },
  ) {
    if (!body?.finding) {
      return {
        action: null,
        meter: this.canvasService.emptyAccessibilityFixPreviewMeter(),
      };
    }
    const sid =
      typeof body?.preview_session_id === 'string'
        ? body.preview_session_id
        : undefined;
    try {
      return await this.canvasService.getAccessibilityFixPreviewItem(
        id,
        body.finding,
        sid,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        action: null,
        error: msg,
        meter: this.canvasService.emptyAccessibilityFixPreviewMeter(),
      };
    }
  }

  @Post('courses/:id/accessibility/fix-apply')
  async applyAccessibilityFixes(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      actions?: Array<{
        action_id: string;
        resource_type: string;
        resource_id: string;
        update_key: string;
        rule_id: string;
        content_hash: string;
      }>;
    },
  ) {
    const actions = Array.isArray(body?.actions) ? body.actions : [];
    return this.canvasService.applyAccessibilityFixes(id, actions);
  }

  @Get('courses/:id/accessibility/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="accessibility_report.csv"',
  )
  async exportAccessibilityCsv(
    @Param('id', ParseIntPipe) id: number,
    @Query('resource_types') resourceTypesRaw?: string,
    @Query('rule_ids') ruleIdsRaw?: string,
  ): Promise<string> {
    const resourceTypes = (resourceTypesRaw || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const ruleIds = (ruleIdsRaw || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const report = await this.canvasService.getAccessibilityScan(id, {
      resourceTypes: resourceTypes.length ? resourceTypes : undefined,
      ruleIds: ruleIds.length ? ruleIds : undefined,
    });
    return this.canvasService.buildAccessibilityCsv(report);
  }

  @Put('outcomes/:outcomeId/standards')
  async updateOutcomeStandards(
    @Param('outcomeId', ParseIntPipe) outcomeId: number,
    @Body() body: { standards: string[] },
  ) {
    return this.canvasService.updateOutcomeStandards(
      outcomeId,
      body.standards ?? [],
    );
  }

  @Get('courses/:id/bulk_user_tags')
  async getBulkUserTags(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getBulkUserTags(id);
  }

  // Individual GET endpoints (for fetching full item data)
  @Get('courses/:courseId/assignments/:id')
  async getAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.getAssignment(courseId, id);
  }

  @Get('courses/:courseId/quizzes/:id')
  async getQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.getQuiz(courseId, id);
  }

  @Get('courses/:courseId/discussions/:id')
  async getDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.getDiscussion(courseId, id);
  }

  @Get('courses/:courseId/pages/:id')
  async getPage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
  ) {
    return this.canvasService.getPage(courseId, id);
  }

  @Get('courses/:courseId/announcements/:id')
  async getAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.getAnnouncement(courseId, id);
  }

  @Get('courses/:courseId/modules/:id')
  async getModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.getModule(courseId, id);
  }

  // Individual update endpoints (for inline editing)
  @Put('courses/:courseId/new_quizzes/:id')
  async updateNewQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    try {
      return await this.canvasService.updateNewQuizRow(courseId, id, updates);
    } catch (error: any) {
      throw new HttpException(
        {
          message: error.message || 'Failed to update New Quiz',
          error: String(error?.message || error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:courseId/assignments/:id')
  async updateAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    try {
      return await this.canvasService.updateAssignment(courseId, id, updates);
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update assignment: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:courseId/quizzes/:id')
  async updateQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    try {
      return await this.canvasService.updateQuiz(courseId, id, updates);
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update quiz ${id}: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:courseId/discussions/:id')
  async updateDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    try {
      return await this.canvasService.updateDiscussion(courseId, id, updates);
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update discussion ${id}: ${error?.message || 'Unknown error'}`,
          error: error?.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:courseId/pages/:id')
  async updatePage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
    @Body() updates: Record<string, any>,
  ) {
    return this.canvasService.updatePage(courseId, id, updates);
  }

  @Put('courses/:courseId/announcements/:id')
  async updateAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    try {
      return await this.canvasService.updateAnnouncement(courseId, id, updates);
    } catch (error: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update announcement ${id}: ${error?.message || 'Unknown error'}`,
          error: error?.message || 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('courses/:courseId/modules/:id')
  async updateModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>,
  ) {
    return this.canvasService.updateModule(courseId, id, updates);
  }

  // Bulk update endpoints (kept for future use)
  @Put('courses/:courseId/assignments/_bulk/update')
  async bulkUpdateAssignments(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdateAssignments(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  @Put('courses/:courseId/quizzes/_bulk/update')
  async bulkUpdateQuizzes(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdateQuizzes(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  @Put('courses/:courseId/discussions/_bulk/update')
  async bulkUpdateDiscussions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdateDiscussions(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  @Put('courses/:courseId/pages/_bulk/update')
  async bulkUpdatePages(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: string[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdatePages(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  @Put('courses/:courseId/announcements/_bulk/update')
  async bulkUpdateAnnouncements(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdateAnnouncements(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  @Put('courses/:courseId/modules/_bulk/update')
  async bulkUpdateModules(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> },
  ) {
    return this.canvasService.bulkUpdateModules(
      courseId,
      body.itemIds,
      body.updates,
    );
  }

  // Delete endpoints
  @Delete('courses/:courseId/assignments/:id')
  async deleteAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteAssignment(courseId, id);
  }

  @Delete('courses/:courseId/quizzes/:id')
  async deleteQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteQuiz(courseId, id);
  }

  @Delete('courses/:courseId/discussions/:id')
  async deleteDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteDiscussion(courseId, id);
  }

  @Delete('courses/:courseId/pages/:id')
  async deletePage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
  ) {
    return this.canvasService.deletePage(courseId, id);
  }

  @Delete('courses/:courseId/modules/:id')
  async deleteModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteModule(courseId, id);
  }

  @Delete('courses/:courseId/announcements/:id')
  async deleteAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.canvasService.deleteAnnouncement(courseId, id);
  }

  // Content Export endpoint
  @Post('courses/:courseId/content_exports')
  async createContentExport(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { export_type?: string },
  ) {
    return this.canvasService.createContentExport(
      courseId,
      body.export_type || 'common_cartridge',
    );
  }

  // Create endpoints (for duplication)
  @Post('courses/:courseId/assignments')
  async createAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createAssignment(courseId, body);
  }

  @Post('courses/:courseId/quizzes')
  async createQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createQuiz(courseId, body);
  }

  @Post('courses/:courseId/discussions')
  async createDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createDiscussion(courseId, body);
  }

  @Post('courses/:courseId/pages')
  async createPage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createPage(courseId, body);
  }

  @Post('courses/:courseId/announcements')
  async createAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createAnnouncement(courseId, body);
  }

  @Post('courses/:courseId/modules')
  async createModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createModule(courseId, body);
  }

  @Post('courses/:courseId/new_quizzes')
  async createNewQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createNewQuiz(courseId, body);
  }

  @Post('courses/:courseId/quizzes/:quizId/extensions')
  async createQuizExtensions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body()
    body: {
      quiz_extensions: Array<{
        user_id: number;
        extra_time?: number;
        extra_attempts?: number;
      }>;
    },
  ) {
    return this.canvasService.createQuizExtensions(
      courseId,
      quizId,
      body.quiz_extensions,
    );
  }

  @Get('courses/:courseId/assignments/:assignmentId/overrides')
  async getAssignmentOverrides(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.canvasService.getAssignmentOverrides(courseId, assignmentId);
  }

  @Delete('courses/:courseId/assignments/:assignmentId/overrides/:overrideId')
  async deleteAssignmentOverride(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('overrideId', ParseIntPipe) overrideId: number,
  ) {
    return this.canvasService.deleteAssignmentOverride(
      courseId,
      assignmentId,
      overrideId,
    );
  }

  @Post('courses/:courseId/assignments/:assignmentId/overrides')
  async createAssignmentOverride(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body()
    body: {
      assignment_override: {
        student_ids?: number[];
        due_at?: string;
        unlock_at?: string;
        lock_at?: string;
      };
    },
  ) {
    return this.canvasService.createAssignmentOverride(
      courseId,
      assignmentId,
      body.assignment_override,
    );
  }

  @Post('courses/:courseId/modules/:moduleId/items')
  async createModuleItem(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: Record<string, any>,
  ) {
    return this.canvasService.createModuleItem(courseId, moduleId, body);
  }

  @Get('courses/:courseId/modules/:moduleId/items')
  async getModuleItems(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.canvasService.getModuleItems(courseId, moduleId);
  }

  @Delete('courses/:courseId/modules/:moduleId/items/:itemId')
  async deleteModuleItem(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('itemId') itemId: string,
    @Body() body: { type: string; content_id: number | string },
  ) {
    return this.canvasService.deleteModuleItem(courseId, {
      type: body.type,
      content_id: body.content_id,
    });
  }

  @Delete('courses/:id/files/bulk')
  async bulkDeleteFiles(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() body: { fileIds: number[]; isFolders?: boolean[] },
  ) {
    if (Array.isArray(body?.isFolders) && body.isFolders.some(Boolean)) {
      throw new HttpException(
        'Folders must be deleted directly in Canvas',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.canvasService.bulkDeleteFiles(
      courseId,
      body.fileIds,
      body.isFolders || [],
    );
  }

  @Post('courses/:courseId/files/copy')
  async copyFile(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body()
    body: {
      source_file_id: number;
      parent_folder_id?: number;
      display_name?: string;
    },
  ) {
    if (!body?.source_file_id) {
      throw new HttpException(
        'source_file_id required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.canvasService.copyFileToFolder(
      courseId,
      Number(body.source_file_id),
      body.parent_folder_id != null ? Number(body.parent_folder_id) : null,
      body.display_name,
    );
  }

  @Post('courses/:courseId/folders')
  async createFolder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { name: string; parent_folder_id?: number },
  ) {
    if (!body?.name)
      throw new HttpException('name required', HttpStatus.BAD_REQUEST);
    return this.canvasService.createFolder(
      courseId,
      body.name,
      body.parent_folder_id,
    );
  }

  @Post('courses/:courseId/folders/copy')
  async copyFolder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body()
    body: {
      source_folder_id: number;
      parent_folder_id?: number;
      name?: string;
    },
  ) {
    if (!body?.source_folder_id) {
      throw new HttpException(
        'source_folder_id required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.canvasService.copyFolderToFolder(
      courseId,
      Number(body.source_folder_id),
      body.parent_folder_id != null ? Number(body.parent_folder_id) : null,
      body.name,
    );
  }

  @Delete('courses/:courseId/files/:fileId')
  async deleteFileOrFolder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Body() body: { isFolder?: boolean },
  ) {
    if (body?.isFolder) {
      throw new HttpException(
        'Folders must be deleted directly in Canvas',
        HttpStatus.BAD_REQUEST,
      );
    }
    const results = await this.canvasService.bulkDeleteFiles(
      courseId,
      [fileId],
      [!!body?.isFolder],
    );
    const r = results[0];
    if (r && !r.success)
      throw new HttpException(
        r.error || 'Delete failed',
        HttpStatus.BAD_REQUEST,
      );
    return { success: true };
  }

  @Put('courses/:id/files/:fileId')
  async updateFileOrFolder(
    @Param('id', ParseIntPipe) courseId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Body()
    body: {
      name?: string;
      display_name?: string;
      locked?: boolean;
      isFolder?: boolean;
    },
  ) {
    if (body.isFolder) return this.canvasService.updateFolder(fileId, body);
    return this.canvasService.updateFile(courseId, fileId, body);
  }
}
