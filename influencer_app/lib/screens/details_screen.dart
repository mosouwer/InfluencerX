import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../api_service.dart';

class DetailsScreen extends StatefulWidget {
  final Map<String, dynamic> influencer;

  const DetailsScreen({super.key, required this.influencer});

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    Future.delayed(const Duration(milliseconds: 200), () {
      _animController.forward();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _instructionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 400.0,
            pinned: true,
            backgroundColor: Theme.of(context).colorScheme.surface,
            elevation: 0,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child:
                    const Icon(Icons.arrow_back, color: Colors.black, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'image_${widget.influencer['id']}',
                child: Image.network(
                  widget.influencer['image'],
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.1),
                end: Offset.zero,
              ).animate(CurvedAnimation(
                parent: _animController,
                curve: Curves.easeOutCubic,
              )),
              child: FadeTransition(
                opacity: _animController,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Hero(
                        tag: 'name_${widget.influencer['id']}',
                        child: Material(
                          color: Colors.transparent,
                          child: Text(
                            widget.influencer['name'],
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                              letterSpacing: -1,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.influencer['niche'],
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatColumn('Followers',
                              _formatFollowers(widget.influencer['followers'])),
                          _buildStatColumn(
                              'Rating', widget.influencer['rating'].toString()),
                          _buildStatColumn('Engagement',
                              '${widget.influencer['engagement']}%'),
                        ],
                      ),
                      const SizedBox(height: 40),
                      const Text(
                        'About',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.influencer['bio'] ??
                            'A dedicated content creator focusing on modern trends, minimalist aesthetics, and sustainable living. High engagement rate with a loyal following.',
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.6,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 40),
                      const Text(
                        'Packages',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (widget.influencer['rates'] != null) ...[
                        if (widget.influencer['rates']['story'] != null)
                          _buildPackageCard('story', 'Instagram Story',
                              '₹${widget.influencer['rates']['story']}'),
                        const SizedBox(height: 12),
                        if (widget.influencer['rates']['post'] != null)
                          _buildPackageCard('post', 'Dedicated Post',
                              '₹${widget.influencer['rates']['post']}',
                              isFeatured: true),
                        const SizedBox(height: 12),
                        if (widget.influencer['rates']['reel'] != null)
                          _buildPackageCard('reel', 'Instagram Reel',
                              '₹${widget.influencer['rates']['reel']}'),
                      ] else ...[
                        _buildPackageCard('story', 'Instagram Story', '₹5,000'),
                        const SizedBox(height: 12),
                        _buildPackageCard('post', 'Dedicated Post', '₹12,000',
                            isFeatured: true),
                      ],
                      const SizedBox(height: 40),
                      const Text(
                        'Campaign Details',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _instructionController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText:
                              'Add instructions or requirements for the influencer...',
                          hintStyle: const TextStyle(color: Colors.black38),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade200),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(
                                color: Colors.black, width: 1.5),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      GestureDetector(
                        onTap: () async {
                          if (_attachedFilePath != null) {
                            setState(() {
                              _attachedFilePath = null;
                              _attachedFileName = null;
                            });
                            return;
                          }
                          try {
                            FilePickerResult? result =
                                await FilePicker.platform.pickFiles(
                              type: FileType.media, // Images and videos
                            );
                            if (result != null &&
                                result.files.single.path != null) {
                              setState(() {
                                _attachedFilePath = result.files.single.path;
                                _attachedFileName = result.files.single.name;
                              });
                            }
                          } catch (e) {
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text('Failed to pick file: $e')),
                            );
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _attachedFilePath != null
                                  ? Colors.black
                                  : Colors.grey.shade300,
                              width: _attachedFilePath != null ? 2.0 : 1.0,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            color: _attachedFilePath != null
                                ? Colors.grey.shade50
                                : Colors.white,
                          ),
                          child: Column(
                            children: [
                              Icon(
                                _attachedFilePath != null
                                    ? Icons.check_circle
                                    : Icons.cloud_upload_outlined,
                                color: _attachedFilePath != null
                                    ? Colors.green
                                    : Colors.black54,
                                size: 36,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _attachedFilePath != null
                                    ? '$_attachedFileName attached (Tap to remove)'
                                    : 'Tap to select campaign pic/video',
                                style: TextStyle(
                                  color: _attachedFilePath != null
                                      ? Colors.black87
                                      : Colors.black54,
                                  fontWeight: _attachedFilePath != null
                                      ? FontWeight.bold
                                      : FontWeight.w500,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        child: FilledButton(
          onPressed: _selectedPackage == null ? null : _handleBooking,
          child: _isBooking
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                )
              : Text(_selectedPackage == null ? 'Select a Package' : 'Request Collaboration'),
        ),
      ),
    );
  }

  String? _selectedPackage;
  bool _isBooking = false;
  final TextEditingController _instructionController = TextEditingController();
  String? _attachedFilePath;
  String? _attachedFileName;

  Future<void> _handleBooking() async {
    if (_selectedPackage == null) return;

    setState(() => _isBooking = true);
    try {
      await ApiService.createDeal(
        widget.influencer['id'],
        _selectedPackage!,
        instructions: _instructionController.text,
        mediaPath: _attachedFilePath,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Request sent to Admin for approval!')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isBooking = false);
    }
  }

  Widget _buildStatColumn(String label, String value) {
    return Expanded(
      child: Card(
        color: Theme.of(context).colorScheme.surfaceVariant,
        elevation: 0,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPackageCard(String packageKey, String title, String price,
      {bool isFeatured = false}) {
    final isSelected = _selectedPackage == packageKey;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPackage = packageKey;
        });
      },
      child: Card(
        color: isSelected ? Theme.of(context).colorScheme.primary : (isFeatured ? Theme.of(context).colorScheme.secondaryContainer : Theme.of(context).colorScheme.surface),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outlineVariant,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isSelected ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface,
                ),
              ),
              Text(
                price,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isSelected ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatFollowers(dynamic count) {
    if (count is! num) return count.toString();
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}
