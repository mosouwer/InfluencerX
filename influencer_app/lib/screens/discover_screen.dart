import 'package:flutter/material.dart';
import '../widgets/influencer_card.dart';
import '../api_service.dart';
import 'login_screen.dart';



class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;


  late Future<List<dynamic>> _influencersFuture;

  String _selectedCategory = 'All';
  final List<String> _categories = [
    'All',
    'Fashion',
    'Food',
    'Travel',
    'Fitness',
    'Tech',
    'Lifestyle',
    'Beauty'
  ];

  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _influencersFuture = ApiService.getInfluencers();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutQuint),
    );
    _animController.forward();
  }

  @override
  void dispose() {

    _animController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _influencersFuture = ApiService.getInfluencers();
            });
            await _influencersFuture;
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
            SliverAppBar(
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              pinned: false,
              floating: true,
              titleSpacing: 24,
              title: _isSearching
                  ? SizedBox(
                      height: 48,
                      child: SearchBar(
                        controller: _searchController,
                        hintText: 'Search influencers...',
                        autoFocus: true,
                        elevation: MaterialStateProperty.all(0),
                        backgroundColor: MaterialStateProperty.all(
                            Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5)),
                        padding: MaterialStateProperty.all(const EdgeInsets.symmetric(horizontal: 16)),
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                      ),
                    )
                  : const Text(
                      'Influencers',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 28,
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
                  icon: Icon(_isSearching ? Icons.close : Icons.search_rounded),
                  onPressed: () {
                    setState(() {
                      if (_isSearching) {
                        _isSearching = false;
                        _searchQuery = '';
                        _searchController.clear();
                      } else {
                        _isSearching = true;
                      }
                    });
                  },
                ),
                if (!_isSearching) ...[
                  IconButton(
                    icon: const Icon(Icons.menu, color: Colors.black, size: 24),
                    onPressed: () {},
                  ),
                  PopupMenuButton<String>(
                    icon:
                        const Icon(Icons.person, color: Colors.black, size: 24),
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
              ],
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 56,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final isSelected = _selectedCategory == category;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: FilterChip(
                        label: Text(category),
                        selected: isSelected,
                        onSelected: (bool selected) {
                          setState(() {
                            _selectedCategory = category;
                            _animController.reset();
                            _animController.forward();
                          });
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.only(
                  left: 24.0, right: 24.0, top: 16.0, bottom: 8.0),
              sliver: FutureBuilder<List<dynamic>>(
                future: _influencersFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SliverToBoxAdapter(
                      child: Center(
                          child:
                              CircularProgressIndicator(color: Colors.black)),
                    );
                  } else if (snapshot.hasError) {
                    return SliverToBoxAdapter(
                      child: Center(
                          child: Text('Error: ${snapshot.error}',
                              style: const TextStyle(color: Colors.red))),
                    );
                  } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Center(child: Text('No influencers found.')),
                    );
                  }

                  // Filter influencers
                  var influencers = snapshot.data!;
                  if (_selectedCategory != 'All') {
                    influencers = influencers.where((inf) {
                      final niche =
                          (inf['niche'] as String? ?? '').toLowerCase();
                      return niche.contains(_selectedCategory.toLowerCase());
                    }).toList();
                  }

                  if (_searchQuery.isNotEmpty) {
                    final query = _searchQuery.toLowerCase().trim();
                    influencers = influencers.where((inf) {
                      final name = (inf['name'] as String? ?? '').toLowerCase();
                      final username = '@${name.replaceAll(' ', '')}';
                      final niche =
                          (inf['niche'] as String? ?? '').toLowerCase();

                      return name.contains(query) ||
                          username.contains(query) ||
                          niche.contains(query);
                    }).toList();
                  }

                  if (influencers.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(40.0),
                        child: Center(
                            child: Text('No influencers in this category.',
                                style: TextStyle(color: Colors.black54))),
                      ),
                    );
                  }

                  return SliverList(
                    key: ValueKey(_selectedCategory),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final influencer =
                            influencers[index] as Map<String, dynamic>;
                        final imageUrl = influencer['image']?.toString() ?? '';
                        if (!imageUrl.startsWith('http')) {
                          influencer['image'] =
                              'https://i.pravatar.cc/150?u=${influencer['id']}';
                        }

                        return FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0, 0.2),
                              end: Offset.zero,
                            ).animate(CurvedAnimation(
                              parent: _animController,
                              curve: Interval(
                                (index / influencers.length) * 0.5,
                                1.0,
                                curve: Curves.easeOutQuart,
                              ),
                            )),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 0.0),
                              child: InfluencerCard(influencer: influencer),
                            ),
                          ),
                        );
                      },
                      childCount: influencers.length,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    ),
   );
  }
}
