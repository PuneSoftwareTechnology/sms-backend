import dashboardRepository from '../repositories/dashboard.repository.js';

// Simple in-memory cache (30-second TTL)
let cache = { data: null, expiresAt: 0, key: '' };

async function getStats(filters) {
  const cacheKey = JSON.stringify(filters);
  if (cache.key === cacheKey && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const [
    // Tier 1: Revenue
    revenueCollected, pendingDues, revenueByCourse, revenueByInstitute, revenueTrend, avgFee,
    // Tier 2: Enrollment
    activeEnrollments, newThisMonth, newLastMonth, enrollmentTrend,
    courseDistribution, instituteEnrollments, completionBreakdown,
    // Tier 3: Enquiry
    enquiryCount, enquiriesByStatus, demoBreakdown, enquiryTrend,
    // Tier 4: Placement
    placementOverall, placementByCourse, awaitingPlacement, topCompanies,
    // Tier 5: Recruiter
    activeRecruiters, cvDownloads, shortlistCount, inDemandCourses,
    // Tier 6: Assessment
    techScoreByCourse, avgCommScore, testCompletion,
  ] = await Promise.all([
    dashboardRepository.getRevenueCollected(filters),
    dashboardRepository.getPendingDues(),
    dashboardRepository.getRevenueByCourse(filters),
    dashboardRepository.getRevenueByInstitute(filters),
    dashboardRepository.getRevenueTrend(),
    dashboardRepository.getAverageFee(filters),

    dashboardRepository.getActiveEnrollments(),
    dashboardRepository.getNewEnrollments('current'),
    dashboardRepository.getNewEnrollments('previous'),
    dashboardRepository.getEnrollmentTrend(),
    dashboardRepository.getCourseDistribution(filters),
    dashboardRepository.getInstituteEnrollments(filters),
    dashboardRepository.getCompletionBreakdown(),

    dashboardRepository.getEnquiryCount(filters),
    dashboardRepository.getEnquiriesByStatus(filters),
    dashboardRepository.getDemoBreakdown(filters),
    dashboardRepository.getEnquiryTrend(),

    dashboardRepository.getPlacementOverall(),
    dashboardRepository.getPlacementByCourse(),
    dashboardRepository.getAwaitingPlacement(),
    dashboardRepository.getTopHiringCompanies(),

    dashboardRepository.getActiveRecruiters(),
    dashboardRepository.getCvDownloads(filters),
    dashboardRepository.getShortlistCount(filters),
    dashboardRepository.getInDemandCourses(filters),

    dashboardRepository.getTechScoreByCourse(),
    dashboardRepository.getAvgCommunicationScore(),
    dashboardRepository.getTestCompletion(),
  ]);

  // Derived metrics
  const totalBasis = completionBreakdown.reduce((s, r) => s + r.count, 0);
  const dropoutCount = completionBreakdown.find((r) => r.status === 'DROPOUT')?.count || 0;
  const completedCount = completionBreakdown.find((r) => r.status === 'COMPLETED')?.count || 0;

  const enrolledEnquiries = enquiriesByStatus.find((r) => r.status === 'CONVERTED')?.count || 0;
  const conversionRate = enquiryCount > 0 ? Math.round((enrolledEnquiries / enquiryCount) * 100) : 0;

  const placementRate = placementOverall.total > 0
    ? Math.round((placementOverall.placed / placementOverall.total) * 100)
    : 0;

  const testCompletionRate = testCompletion.totalStudents > 0
    ? Math.round((testCompletion.studentsAttempted / testCompletion.totalStudents) * 100)
    : 0;

  const result = {
    revenue: {
      totalCollected: revenueCollected,
      pendingDues,
      byCourse: revenueByCourse.map((r) => ({ course: r.course, revenue: Number(r.revenue) })),
      byInstitute: revenueByInstitute.map((r) => ({ institute: r.institute, revenue: Number(r.revenue) })),
      trend: revenueTrend.map((r) => ({ label: r.label, value: Number(r.value) })),
      averageFeePerStudent: avgFee,
    },
    enrollment: {
      totalActive: activeEnrollments,
      newThisMonth,
      newLastMonth,
      trend: enrollmentTrend,
      byCourse: courseDistribution,
      byInstitute: instituteEnrollments,
      dropoutRate: totalBasis > 0 ? Math.round((dropoutCount / totalBasis) * 100) : 0,
      completionRate: totalBasis > 0 ? Math.round((completedCount / totalBasis) * 100) : 0,
      statusBreakdown: completionBreakdown,
    },
    enquiry: {
      total: enquiryCount,
      conversionRate,
      byStatus: enquiriesByStatus,
      demoBreakdown,
      trend: enquiryTrend,
    },
    placement: {
      placed: placementOverall.placed,
      notPlaced: placementOverall.notPlaced,
      rate: placementRate,
      byCourse: placementByCourse.map((r) => ({
        course: r.course,
        rate: r.total > 0 ? Math.round((r.placed / r.total) * 100) : 0,
        placed: r.placed,
        total: r.total,
      })),
      awaitingPlacement,
      topCompanies,
    },
    recruiter: {
      activeRecruiters,
      totalDownloads: cvDownloads,
      totalShortlists: shortlistCount,
      inDemandCourses,
    },
    assessment: {
      technicalScoreByCourse: techScoreByCourse,
      avgCommunicationScore: avgCommScore,
      testCompletionRate,
    },
  };

  cache = { data: result, expiresAt: Date.now() + 30_000, key: cacheKey };
  return result;
}

export { getStats };
export default { getStats };
