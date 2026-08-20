import 'dart:async';
import 'package:flutter/material.dart';
import '../api_service.dart';
import 'login_screen.dart';
import 'campaign_details_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Stream<List<dynamic>> _campaignsStream = _createCampaignsStream();
  String _selectedFilter = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Stream<List<dynamic>> _createCampaignsStream() async* {
    while (true) {
      try {
        yield await ApiService.getCampaigns();
      } catch (e) {
        yield* Stream.error(e);
      }
      await Future.delayed(const Duration(seconds: 2));
    }
  }

  void _fetchData() {
    setState(() {
      _campaignsStream = _createCampaignsStream();
    });
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return const Color(0xFF2563EB); // Blue
      case 'review':
        return const Color(0xFFD97706); // Amber
      case 'completed':
        return const Color(0xFF059669); // Emerald
      case 'dispute':
        return const Color(0xFFDC2626); // Red
      case 'pending':
      default:
        return const Color(0xFF6B7280); // Gray
    }
  }

  int _getStatusStep(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 1;
      case 'review':
        return 2;
      case 'active':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF804EE6),
          onRefresh: () async {
            _fetchData();
            await Future.delayed(const Duration(milliseconds: 500));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              // Top Header Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Brand Dashboard',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF804EE6).withOpacity(0.9),
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Campaign Center 👋',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF111827),
                              letterSpacing: -0.6,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.notifications_outlined, color: Color(0xFF374151), size: 22),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('All notifications are up to date'), duration: Duration(seconds: 1)),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          PopupMenuButton<String>(
                            offset: const Offset(0, 48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            onSelected: (value) {
                              if (value == 'logout') {
                                Navigator.of(context).pushReplacement(
                                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                                );
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'logout',
                                child: Row(
                                  children: [
                                    Icon(Icons.logout_rounded, color: Colors.redAccent, size: 18),
                                    SizedBox(width: 10),
                                    Text('Sign Out', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w600, fontSize: 14)),
                                  ],
                                ),
                              ),
                            ],
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF804EE6), Color(0xFFFF8A3D)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF804EE6).withOpacity(0.25),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Text(
                                  'IX',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.5),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Main Data Content Stream
              StreamBuilder<List<dynamic>>(
                stream: _campaignsStream,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                        child: Column(
                          children: [
                            const CircularProgressIndicator(color: Color(0xFF804EE6)),
                            const SizedBox(height: 16),
                            Text(
                              'Loading live campaigns...',
                              style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    );
                  } else if (snapshot.hasError && !snapshot.hasData) {
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Center(child: Text('Error: ${snapshot.error}')),
                      ),
                    );
                  }

                  final allCampaigns = snapshot.data ?? [];

                  // Compute real-time analytics
                  int totalSpent = 0;
                  int activeCount = 0;
                  int reviewCount = 0;
                  int completedCount = 0;
                  int pendingCount = 0;

                  for (var c in allCampaigns) {
                    final st = (c['status'] ?? 'pending').toString().toLowerCase();
                    if (st == 'active') activeCount++;
                    if (st == 'review') reviewCount++;
                    if (st == 'completed') completedCount++;
                    if (st == 'pending') pendingCount++;

                    if (st != 'dispute') {
                      var amt = c['amount'];
                      if (amt is num) {
                        totalSpent += amt.toInt();
                      } else if (amt is String) {
                        totalSpent += int.tryParse(amt) ?? 0;
                      }
                    }
                  }

                  // Apply Filter & Search
                  var filteredCampaigns = allCampaigns.where((c) {
                    final st = (c['status'] ?? 'pending').toString().toLowerCase();
                    if (_selectedFilter != 'all' && st != _selectedFilter) {
                      return false;
                    }
                    if (_searchQuery.isNotEmpty) {
                      final name = (c['influencerName'] ?? '').toString().toLowerCase();
                      final campName = (c['campaignName'] ?? '').toString().toLowerCase();
                      final type = (c['type'] ?? c['packageType'] ?? '').toString().toLowerCase();
                      final query = _searchQuery.toLowerCase();
                      return name.contains(query) || campName.contains(query) || type.contains(query);
                    }
                    return true;
                  }).toList();

                  return SliverList(
                    delegate: SliverChildListDelegate([
                      // Hero Spend Analytics Card
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF804EE6), Color(0xFF5B21B6)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF804EE6).withOpacity(0.35),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.18),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 20),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(
                                        'TOTAL CAMPAIGN SPEND',
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.85),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.trending_up_rounded, color: Color(0xFF86EFAC), size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          '+14.2%',
                                          style: TextStyle(
                                            color: Colors.white.withOpacity(0.95),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '₹${totalSpent.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -1.0,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.auto_graph_rounded, color: Color(0xFFFFC078), size: 16),
                                        const SizedBox(width: 8),
                                        Text(
                                          '${allCampaigns.length} Total Campaigns',
                                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '$activeCount Active Now',
                                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Secondary Metrics 3-Col Grid
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            Expanded(child: _buildMetricTile('Active', '$activeCount', const Color(0xFF2563EB), Icons.rocket_launch_rounded)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildMetricTile('In Review', '$reviewCount', const Color(0xFFD97706), Icons.rate_review_rounded)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildMetricTile('Done', '$completedCount', const Color(0xFF059669), Icons.verified_rounded)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Search Input Field
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) {
                              setState(() {
                                _searchQuery = val;
                              });
                            },
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                            decoration: InputDecoration(
                              hintText: 'Search campaigns, creators, deliverables...',
                              hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400, fontWeight: FontWeight.w500),
                              prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF9CA3AF), size: 20),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() {
                                          _searchQuery = '';
                                        });
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Horizontal Filter Tabs
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            _buildFilterChip('all', 'All (${allCampaigns.length})'),
                            _buildFilterChip('active', 'Active ($activeCount)'),
                            _buildFilterChip('review', 'Review ($reviewCount)'),
                            _buildFilterChip('pending', 'Pending ($pendingCount)'),
                            _buildFilterChip('completed', 'Completed ($completedCount)'),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Section Title
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Recent Campaigns',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.grey.shade900,
                              ),
                            ),
                            Text(
                              '${filteredCampaigns.length} items',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade500,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Campaign Cards List or Empty State
                      if (filteredCampaigns.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFF3F4F6)),
                            ),
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF804EE6).withOpacity(0.08),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.campaign_outlined, size: 36, color: Color(0xFF804EE6)),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'No Campaigns Found',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _searchQuery.isNotEmpty
                                      ? 'No matching results for "$_searchQuery". Try different keywords.'
                                      : 'You don\'t have any ${_selectedFilter != 'all' ? _selectedFilter : ''} campaigns currently.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: Colors.grey.shade500, height: 1.4),
                                ),
                                if (_searchQuery.isNotEmpty || _selectedFilter != 'all') ...[
                                  const SizedBox(height: 16),
                                  TextButton.icon(
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchQuery = '';
                                        _selectedFilter = 'all';
                                      });
                                    },
                                    icon: const Icon(Icons.refresh_rounded, size: 16),
                                    label: const Text('Reset Filters', style: TextStyle(fontWeight: FontWeight.w700)),
                                    style: TextButton.styleFrom(
                                      foregroundColor: const Color(0xFF804EE6),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        )
                      else
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: filteredCampaigns.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 14),
                            itemBuilder: (context, index) {
                              final camp = filteredCampaigns[index];
                              return _buildModernCampaignCard(camp);
                            },
                          ),
                        ),

                      const SizedBox(height: 36),
                    ]),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricTile(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF111827)),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String title) {
    final isSelected = _selectedFilter == filterKey;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = filterKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF804EE6) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF804EE6) : const Color(0xFFE5E7EB),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF804EE6).withOpacity(0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : const Color(0xFF4B5563),
          ),
        ),
      ),
    );
  }

  Widget _buildMilestonePoints(int currentStep, Color statusColor) {
    final steps = ['Offer', 'Review', 'Active', 'Done'];

    return Row(
      children: [
        for (int i = 0; i < steps.length; i++) ...[
          // Milestone Point Node
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: currentStep >= i + 1
                      ? (currentStep == i + 1 ? statusColor : const Color(0xFF804EE6))
                      : const Color(0xFFF3F4F6),
                  border: Border.all(
                    color: currentStep >= i + 1
                        ? (currentStep == i + 1 ? statusColor : const Color(0xFF804EE6))
                        : const Color(0xFFE5E7EB),
                    width: 1.5,
                  ),
                  boxShadow: currentStep == i + 1
                      ? [
                          BoxShadow(
                            color: statusColor.withOpacity(0.35),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: currentStep > i + 1
                      ? const Icon(Icons.check, size: 12, color: Colors.white)
                      : Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: currentStep >= i + 1 ? Colors.white : Colors.grey.shade400,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[i],
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: currentStep == i + 1 ? FontWeight.w800 : FontWeight.w600,
                  color: currentStep >= i + 1
                      ? (currentStep == i + 1 ? statusColor : const Color(0xFF1F2937))
                      : Colors.grey.shade400,
                ),
              ),
            ],
          ),
          // Connecting Line between Milestone Nodes
          if (i < steps.length - 1)
            Expanded(
              child: Container(
                height: 2.5,
                margin: const EdgeInsets.only(bottom: 16, left: 4, right: 4),
                decoration: BoxDecoration(
                  color: currentStep > i + 1
                      ? const Color(0xFF804EE6)
                      : const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildModernCampaignCard(dynamic campaign) {
    final influencerId = campaign['influencerId'] ?? '';
    final influencerName = campaign['influencerName'] ?? 'Creator';
    final avatarUrl = 'https://i.pravatar.cc/150?u=$influencerId';
    final campaignName = campaign['campaignName'] ?? campaign['packageType'] ?? 'Campaign Collaboration';
    final type = (campaign['type'] ?? campaign['packageType'] ?? 'Custom').toString();
    final status = (campaign['status'] ?? 'pending').toString().toLowerCase();
    final statusColor = _getStatusColor(status);
    final amount = campaign['amount'] ?? 0;
    final currentStep = _getStatusStep(status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CampaignDetailsScreen(campaign: Map<String, dynamic>.from(campaign)),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Creator Info & Status Badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.purple.shade50,
                      backgroundImage: NetworkImage(avatarUrl),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            influencerName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            type,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            status.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: statusColor,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Campaign Title
                Text(
                  campaignName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F2937),
                    letterSpacing: -0.2,
                  ),
                ),

                const SizedBox(height: 14),

                // Milestone Progress Points (Offer -> Active -> Review -> Done)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFF3F4F6)),
                  ),
                  child: _buildMilestonePoints(currentStep, statusColor),
                ),

                const Divider(height: 24, thickness: 1, color: Color(0xFFF9FAFB)),

                // Bottom Footer: Amount & View Action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Payout',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey.shade400),
                        ),
                        Text(
                          '₹$amount',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF804EE6),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          'View Details',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF9CA3AF)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
