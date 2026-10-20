import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api_service.dart';
import 'login_screen.dart';

class InfluencerCampaignsScreen extends StatefulWidget {
  const InfluencerCampaignsScreen({super.key});

  @override
  State<InfluencerCampaignsScreen> createState() => _InfluencerCampaignsScreenState();
}

class _InfluencerCampaignsScreenState extends State<InfluencerCampaignsScreen> {
  late Future<List<dynamic>> _campaignsFuture;
  String _selectedFilter = 'all';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCampaigns();
  }

  void _loadCampaigns() {
    setState(() {
      _campaignsFuture = ApiService.getCampaigns();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'accepted':
        return const Color(0xFF804EE6);
      case 'completed':
        return const Color(0xFF10B981);
      case 'rejected':
      case 'dispute':
        return const Color(0xFFEF4444);
      case 'review':
        return const Color(0xFFF59E0B);
      case 'pending':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  String _formatStatusLabel(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'accepted':
        return 'Accepted / In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Declined';
      case 'review':
        return 'In Review';
      case 'pending':
      default:
        return 'Pending Action';
    }
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: const Text('Are you sure you want to sign out of your creator workspace?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ApiService.logout();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _openCampaignDetails(Map<String, dynamic> campaign) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CampaignDetailSheet(
        campaign: campaign,
        onStatusChanged: () {
          _loadCampaigns();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService.currentUser;
    final creatorName = user?['profile']?['name'] ?? user?['name'] ?? 'Creator';
    final creatorEmail = user?['email'] ?? 'creator@influencex.com';
    final avatarLetter = creatorName.isNotEmpty ? creatorName.substring(0, 1).toUpperCase() : 'C';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _loadCampaigns();
          },
          color: const Color(0xFF804EE6),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              // Top Creator Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF804EE6), Color(0xFFEC4899)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF804EE6).withOpacity(0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                avatarLetter,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    creatorName,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF111827),
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified, color: Color(0xFF804EE6), size: 16),
                                ],
                              ),
                              Text(
                                creatorEmail,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade500,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: _handleLogout,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                        ),
                        icon: const Icon(Icons.logout_rounded, color: Color(0xFF6B7280), size: 20),
                        tooltip: 'Sign Out',
                      ),
                    ],
                  ),
                ),
              ),

              // Hero Creator Banner
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E1B4B), Color(0xFF3B0764), Color(0xFF4C1D95)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4C1D95).withOpacity(0.35),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.stars_rounded, color: Color(0xFFFBBF24), size: 14),
                                  SizedBox(width: 4),
                                  Text(
                                    'CREATOR PORTAL',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Text(
                              'Escrow Protected 🛡️',
                              style: TextStyle(color: Color(0xFF86EFAC), fontSize: 11, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Your Brand Campaigns 🎯',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Review assigned campaign briefs, accept brand collaborations, and update deliverable completion status.',
                          style: TextStyle(
                            color: Colors.purple.shade100,
                            fontSize: 12.5,
                            height: 1.4,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Search Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val.toLowerCase().trim();
                        });
                      },
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: 'Search campaigns or brands...',
                        hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                        prefixIcon: Icon(Icons.search_rounded, color: Colors.grey.shade400, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                  });
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),
                ),
              ),

              // Filter Tabs
              SliverToBoxAdapter(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      _buildFilterChip('all', 'All'),
                      const SizedBox(width: 8),
                      _buildFilterChip('pending', 'Pending Offers'),
                      const SizedBox(width: 8),
                      _buildFilterChip('active', 'Accepted'),
                      const SizedBox(width: 8),
                      _buildFilterChip('completed', 'Completed'),
                      const SizedBox(width: 8),
                      _buildFilterChip('rejected', 'Declined'),
                    ],
                  ),
                ),
              ),

              // Campaigns List via FutureBuilder
              FutureBuilder<List<dynamic>>(
                future: _campaignsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: CircularProgressIndicator(color: Color(0xFF804EE6)),
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
                              const SizedBox(height: 12),
                              const Text('Failed to load campaigns', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                              const SizedBox(height: 6),
                              Text(snapshot.error.toString(), textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadCampaigns,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF804EE6),
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  final allCampaigns = snapshot.data ?? [];
                  
                  // Filter by selected tab and search
                  final filtered = allCampaigns.where((item) {
                    if (item is! Map) return false;
                    final status = (item['status'] ?? 'pending').toString().toLowerCase();
                    final title = (item['campaignName'] ?? item['title'] ?? item['packageType'] ?? '').toString().toLowerCase();
                    final brand = (item['brandName'] ?? item['brand'] ?? '').toString().toLowerCase();

                    bool matchesStatus = true;
                    if (_selectedFilter == 'pending') {
                      matchesStatus = status == 'pending';
                    } else if (_selectedFilter == 'active') {
                      matchesStatus = status == 'active' || status == 'accepted';
                    } else if (_selectedFilter == 'completed') {
                      matchesStatus = status == 'completed';
                    } else if (_selectedFilter == 'rejected') {
                      matchesStatus = status == 'rejected';
                    }

                    bool matchesSearch = _searchQuery.isEmpty || title.contains(_searchQuery) || brand.contains(_searchQuery);
                    return matchesStatus && matchesSearch;
                  }).toList();

                  if (filtered.isEmpty) {
                    return SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 70,
                                height: 70,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF804EE6).withOpacity(0.08),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.campaign_outlined, color: Color(0xFF804EE6), size: 36),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No Campaigns Found',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _selectedFilter == 'all'
                                    ? 'You do not have any assigned campaigns yet.\nNew campaigns created by brands or admin will appear here.'
                                    : 'No campaigns match the "${_selectedFilter.toUpperCase()}" filter.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.4),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final c = filtered[index] as Map<String, dynamic>;
                          return _buildCampaignCard(c);
                        },
                        childCount: filtered.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = filterKey;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF804EE6) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF804EE6) : Colors.grey.shade200,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF804EE6).withOpacity(0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF4B5563),
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildCampaignCard(Map<String, dynamic> c) {
    final title = c['campaignName'] ?? c['title'] ?? c['packageType'] ?? 'Campaign Deliverable';
    final brand = c['brandName'] ?? c['brand'] ?? 'Brand Partner';
    final package = c['packageType'] ?? c['type'] ?? 'Post';
    final amount = c['amount'] ?? 0;
    final deadline = c['deadline'] ?? 'Soon';
    final status = (c['status'] ?? 'pending').toString().toLowerCase();
    final statusColor = _getStatusColor(status);
    final statusLabel = _formatStatusLabel(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _openCampaignDetails(c),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Brand & Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF804EE6), Color(0xFF4F46E5)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              brand.isNotEmpty ? brand.substring(0, 1).toUpperCase() : 'B',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              brand,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                            ),
                            Text(
                              package,
                              style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            statusLabel,
                            style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Campaign Title
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                    letterSpacing: -0.3,
                  ),
                ),

                const SizedBox(height: 14),

                // Amount & Deadline Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_outlined, color: Color(0xFF10B981), size: 16),
                        const SizedBox(width: 5),
                        Text(
                          '₹$amount',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text('Escrow', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                    Row(
                      children: [
                        Icon(Icons.event_outlined, color: Colors.grey.shade500, size: 15),
                        const SizedBox(width: 4),
                        Text(
                          'Due: $deadline',
                          style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey, size: 12),
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

extension ListFilter<E> on List<E> {
  Iterable<E> filter(bool Function(E element) test) sync* {
    for (E element in this) {
      if (test(element)) yield element;
    }
  }
}

/// Detailed Campaign Bottom Sheet with interactive Accept, Reject, and Completed actions
class _CampaignDetailSheet extends StatefulWidget {
  final Map<String, dynamic> campaign;
  final VoidCallback onStatusChanged;

  const _CampaignDetailSheet({
    required this.campaign,
    required this.onStatusChanged,
  });

  @override
  State<_CampaignDetailSheet> createState() => _CampaignDetailSheetState();
}

class _CampaignDetailSheetState extends State<_CampaignDetailSheet> {
  late String _currentStatus;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _currentStatus = (widget.campaign['status'] ?? 'pending').toString().toLowerCase();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
      case 'accepted':
        return const Color(0xFF804EE6);
      case 'completed':
        return const Color(0xFF10B981);
      case 'rejected':
      case 'dispute':
        return const Color(0xFFEF4444);
      case 'pending':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  Future<void> _updateCampaignStatus(String newStatus) async {
    final id = widget.campaign['id']?.toString() ?? '';
    final isDeal = widget.campaign['isDeal'] == true;

    setState(() {
      _isSubmitting = true;
    });

    final success = await ApiService.updateStatus(id, newStatus, isDeal: isDeal);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
        if (success) {
          _currentStatus = newStatus;
          widget.campaign['status'] = newStatus;
        }
      });

      HapticFeedback.mediumImpact();
      widget.onStatusChanged();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            newStatus == 'accepted'
                ? '🎉 Campaign accepted! You can now mark it completed when ready.'
                : newStatus == 'completed'
                    ? '✅ Campaign marked as completed! Escrow payout notified.'
                    : 'Campaign status updated to $newStatus',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          backgroundColor: newStatus == 'completed'
              ? const Color(0xFF10B981)
              : newStatus == 'accepted'
                  ? const Color(0xFF804EE6)
                  : Colors.grey.shade800,
        ),
      );
    }
  }

  void _confirmReject() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Decline Campaign', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: const Text('Are you sure you want to decline this campaign offer? The brand and admin will be notified.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _updateCampaignStatus('rejected');
            },
            child: const Text('Yes, Decline', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _confirmComplete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Mark as Completed 🎉', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        content: const Text('Have you delivered all required content and hashtags? Once marked completed, the escrow payout settlement will proceed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Not Yet', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _updateCampaignStatus('completed');
            },
            child: const Text('Confirm Completed', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.campaign['campaignName'] ?? widget.campaign['title'] ?? widget.campaign['packageType'] ?? 'Campaign Collaboration';
    final brand = widget.campaign['brandName'] ?? widget.campaign['brand'] ?? 'Brand Advertiser';
    final package = widget.campaign['packageType'] ?? widget.campaign['type'] ?? 'Post';
    final amount = widget.campaign['amount'] ?? 0;
    final deadline = widget.campaign['deadline'] ?? 'Soon';
    final description = widget.campaign['description'] ?? widget.campaign['deliverables'] ?? widget.campaign['message'] ?? 'Deliverable guidelines provided by brand.';
    final statusColor = _getStatusColor(_currentStatus);

    final isPending = _currentStatus == 'pending';
    final isAccepted = _currentStatus == 'active' || _currentStatus == 'accepted';
    final isCompleted = _currentStatus == 'completed';
    final isRejected = _currentStatus == 'rejected';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 30, offset: Offset(0, -10)),
        ],
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 44,
                height: 5,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),

            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        brand,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.purple.shade700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    _currentStatus.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Key Deliverable Metrics Grid
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricTile(
                          icon: Icons.payments_rounded,
                          iconColor: const Color(0xFF10B981),
                          label: 'ESCROW PAYOUT',
                          value: '₹$amount',
                        ),
                      ),
                      Container(width: 1, height: 40, color: Colors.grey.shade200),
                      Expanded(
                        child: _buildMetricTile(
                          icon: Icons.video_collection_rounded,
                          iconColor: const Color(0xFF804EE6),
                          label: 'FORMAT',
                          value: package,
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricTile(
                          icon: Icons.calendar_today_rounded,
                          iconColor: const Color(0xFFEC4899),
                          label: 'DUE DEADLINE',
                          value: deadline,
                        ),
                      ),
                      Container(width: 1, height: 40, color: Colors.grey.shade200),
                      Expanded(
                        child: _buildMetricTile(
                          icon: Icons.verified_user_rounded,
                          iconColor: const Color(0xFF06B6D4),
                          label: 'SETTLEMENT',
                          value: '100% Escrow',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Deliverable Guidelines & Brief
            Text(
              'CAMPAIGN BRIEF & DELIVERABLES',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey.shade500, letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Text(
                description,
                style: const TextStyle(
                  fontSize: 13.5,
                  color: Color(0xFF374151),
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),

            const SizedBox(height: 24),

            // INTERACTIVE ACTIONS
            if (_isSubmitting)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(color: Color(0xFF804EE6)),
                ),
              )
            else if (isPending) ...[
              // Accept & Reject Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _confirmReject,
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.close_rounded, size: 18),
                          SizedBox(width: 6),
                          Text('Decline', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF10B981), Color(0xFF059669)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.35),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => _updateCampaignStatus('accepted'),
                          child: const Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Accept Campaign',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (isAccepted) ...[
              // Action Dropdown as explicitly requested:
              // "once influencer accepts it there will be an an action dropdown where user can mark the campaign action as completed"
              Text(
                'UPDATE CAMPAIGN STATUS',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey.shade500, letterSpacing: 0.8),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF804EE6), width: 1.5),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: 'active',
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF804EE6)),
                    items: const [
                      DropdownMenuItem(
                        value: 'active',
                        child: Row(
                          children: [
                            Icon(Icons.bolt_rounded, color: Color(0xFF804EE6), size: 18),
                            SizedBox(width: 8),
                            Text('In Progress (Accepted)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'completed',
                        child: Row(
                          children: [
                            Icon(Icons.task_alt_rounded, color: Color(0xFF10B981), size: 18),
                            SizedBox(width: 8),
                            Text('Mark as Completed 🎉', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF10B981))),
                          ],
                        ),
                      ),
                    ],
                    onChanged: (val) {
                      if (val == 'completed') {
                        _confirmComplete();
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Dedicated Direct Button for convenience
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 2,
                  ),
                  onPressed: _confirmComplete,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, size: 20),
                      SizedBox(width: 8),
                      Text('Mark Campaign Completed', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ] else if (isCompleted) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Campaign Completed! 🎉', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF065F46))),
                          SizedBox(height: 2),
                          Text('Deliverables submitted. Admin & Brand notified for payout release.', style: TextStyle(fontSize: 12, color: Color(0xFF047857))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (isRejected) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.cancel_outlined, color: Colors.red, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text('This campaign was declined.', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: iconColor),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Colors.grey.shade500, letterSpacing: 0.5)),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF111827)),
        ),
      ],
    );
  }
}
