import 'dart:async';
import 'package:flutter/material.dart';
import '../api_service.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Stream<List<dynamic>> _campaignsStream = _createCampaignsStream();

  @override
  void initState() {
    super.initState();
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
    // For manual pull-to-refresh
    setState(() {
      _campaignsStream = _createCampaignsStream();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _fetchData();
            await Future.delayed(const Duration(milliseconds: 500));
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverAppBar(
                backgroundColor: Colors.white,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                pinned: false,
                floating: true,
                titleSpacing: 24,
                title: Text(
                  'Dashboard',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                bottom: const PreferredSize(
                  preferredSize: Size.fromHeight(16.0),
                  child: SizedBox(),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.menu, color: Colors.black, size: 28),
                    onPressed: () {},
                  ),
                  PopupMenuButton<String>(
                    icon:
                        const Icon(Icons.person, color: Colors.black, size: 28),
                    offset: const Offset(0, 50),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    onSelected: (value) {
                      if (value == 'logout') {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                              builder: (_) => const LoginScreen()),
                        );
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            Icon(Icons.logout,
                                color: Colors.redAccent, size: 20),
                            SizedBox(width: 12),
                            Text('Logout',
                                style: TextStyle(
                                    color: Colors.redAccent,
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 8),
                ],
              ),
              StreamBuilder<List<dynamic>>(
                stream: _campaignsStream,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(40.0),
                        child: Center(
                            child:
                                CircularProgressIndicator(color: Colors.black)),
                      ),
                    );
                  } else if (snapshot.hasError) {
                    return SliverToBoxAdapter(
                      child: Center(child: Text('Error: ${snapshot.error}')),
                    );
                  }

                  final campaigns = snapshot.data ?? [];

                  // Compute stats locally
                  int totalSpent = 0;
                  for (var c in campaigns) {
                    if (c['status'] != 'dispute') {
                      var amt = c['amount'];
                      if (amt is String) {
                        totalSpent += int.tryParse(amt) ?? 0;
                      } else {
                        totalSpent += (amt as num?)?.toInt() ?? 0;
                      }
                    }
                  }

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index == 0) {
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                            child: Row(
                              children: [
                                Expanded(
                                  child: _buildStatCard(
                                    'Total Spent',
                                    '₹$totalSpent',
                                    Icons.account_balance_wallet,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildStatCard(
                                    'Campaigns',
                                    '${campaigns.length}',
                                    Icons.campaign,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }

                        if (campaigns.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.all(24.0),
                            child: Center(
                                child:
                                    Text('No campaigns found. Start booking!')),
                          );
                        }

                        final campaign = campaigns[index - 1];
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24.0, vertical: 8.0),
                          child: _buildCampaignCard(campaign),
                        );
                      },
                      childCount: campaigns.isEmpty ? 2 : campaigns.length + 1,
                    ),
                  );
                },
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.onPrimaryContainer, size: 28),
            const SizedBox(height: 16),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onPrimaryContainer,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCampaignCard(dynamic campaign) {
    final avatarUrl = 'https://i.pravatar.cc/150?u=${campaign['influencerId']}';
    
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: ListTile(
          leading: CircleAvatar(
            radius: 28,
            backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
            backgroundImage: NetworkImage(avatarUrl),
          ),
          title: Text(
            campaign['influencerName'] ?? 'Unknown',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text('Type: ${campaign['type']?.toString().toUpperCase() ?? 'N/A'}'),
              const SizedBox(height: 8),
              PopupMenuButton<String>(
                offset: const Offset(0, 30),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                onSelected: (newStatus) async {
                  try {
                    if (campaign['isDeal'] == true) {
                      await ApiService.updateDealStatus(campaign['id'], newStatus);
                    } else {
                      await ApiService.updateCampaignStatus(campaign['id'], newStatus);
                    }
                    setState(() {
                      _fetchData();
                    });
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'pending', child: Text('Pending')),
                  PopupMenuItem(value: 'active', child: Text('Active')),
                  PopupMenuItem(value: 'review', child: Text('Review')),
                  PopupMenuItem(value: 'completed', child: Text('Completed')),
                  PopupMenuItem(value: 'dispute', child: Text('Dispute')),
                ],
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(campaign['status']).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        (campaign['status'] ?? 'pending').toString().toUpperCase(),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: _getStatusColor(campaign['status']),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.arrow_drop_down, size: 16, color: _getStatusColor(campaign['status'])),
                    ],
                  ),
                ),
              ),
            ],
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Paid',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                '₹${campaign['amount'] ?? 0}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'active':
        return Colors.blue;
      case 'review':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'dispute':
        return Colors.red;
      case 'pending':
      default:
        return Colors.black54;
    }
  }
}
