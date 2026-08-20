import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import '../api_service.dart';

class DetailsScreen extends StatefulWidget {
  final Map<String, dynamic> influencer;

  const DetailsScreen({super.key, required this.influencer});

  @override
  State<DetailsScreen> createState() => _DetailsScreenState();
}

class _DetailsScreenState extends State<DetailsScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  String? _selectedPackage = 'reel';
  bool _isBooking = false;
  final TextEditingController _instructionController = TextEditingController();
  final TextEditingController _campaignTitleController = TextEditingController();
  String? _attachedFilePath;
  String? _attachedFileName;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) _animController.forward();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _instructionController.dispose();
    _campaignTitleController.dispose();
    super.dispose();
  }

  String _formatFollowers(dynamic count) {
    if (count is! num) {
      final parsed = num.tryParse(count?.toString() ?? '0');
      if (parsed == null) return count?.toString() ?? '0';
      count = parsed;
    }
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  String _getImageUrl() {
    final rawImage = widget.influencer['image']?.toString() ?? '';
    if (rawImage.isNotEmpty && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
      return rawImage;
    }
    final id = widget.influencer['id'] ?? 'creator';
    return 'https://i.pravatar.cc/500?u=$id';
  }

  String _getSelectedPackagePrice() {
    final rates = widget.influencer['rates'];
    if (rates is Map && _selectedPackage != null) {
      final price = rates[_selectedPackage];
      if (price != null) return price.toString();
    }
    switch (_selectedPackage) {
      case 'story':
        return '5,000';
      case 'reel':
        return '15,000';
      case 'post':
        return '12,000';
      default:
        return '10,000';
    }
  }

  Future<void> _handleBooking() async {
    if (_selectedPackage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a deliverable package')),
      );
      return;
    }

    setState(() => _isBooking = true);
    try {
      final instructions = _instructionController.text.trim();
      final title = _campaignTitleController.text.trim();
      final fullInstructions = title.isNotEmpty
          ? 'Campaign: $title\n\n$instructions'
          : instructions;

      await ApiService.createDeal(
        widget.influencer['id'],
        _selectedPackage!,
        instructions: fullInstructions,
        mediaPath: _attachedFilePath,
      );
      if (!mounted) return;
      
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(child: Text('Campaign proposal sent to creator successfully!')),
            ],
          ),
          backgroundColor: const Color(0xFF059669),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.influencer['name'] ?? 'Creator';
    final niche = widget.influencer['niche'] ?? 'Lifestyle';
    final handle = '@${name.toString().toLowerCase().replaceAll(' ', '')}';
    final rating = widget.influencer['rating']?.toString() ?? '4.9';
    final engagement = widget.influencer['engagement']?.toString() ?? '8.4';
    final followersFormatted = _formatFollowers(widget.influencer['followers'] ?? 45000);
    final bio = widget.influencer['bio'] ??
        'High-impact digital creator crafting authentic story-driven content. Specializing in brand storytelling, aesthetic visuals, and high conversion campaigns.';
    final id = widget.influencer['id'] ?? '0';
    final selectedPrice = _getSelectedPackagePrice();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Parallax Image Header with Frosted Back Button
          SliverAppBar(
            expandedHeight: 340.0,
            pinned: true,
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.share_outlined, color: Colors.white, size: 18),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: 'https://influencex.app/creator/$id'));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Creator link copied to clipboard')),
                      );
                    },
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: 'image_$id',
                    child: Image.network(
                      _getImageUrl(),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Image.network(
                          'https://i.pravatar.cc/500?u=$id',
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                  // Dark Gradient Overlay for bottom text
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.35),
                          Colors.transparent,
                          Colors.black.withOpacity(0.7),
                        ],
                        stops: const [0.0, 0.4, 1.0],
                      ),
                    ),
                  ),
                  // Floating Verified Pro Tag on bottom
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, color: Color(0xFF38BDF8), size: 16),
                              const SizedBox(width: 6),
                              Text(
                                '$niche Specialist',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF804EE6).withOpacity(0.9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            '✓ Available for Booking',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Main Profile Body Content
          SliverToBoxAdapter(
            child: FadeTransition(
              opacity: _animController,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Creator Title & Handle
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Hero(
                                tag: 'name_$id',
                                child: Material(
                                  color: Colors.transparent,
                                  child: Text(
                                    name,
                                    style: const TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF111827),
                                      letterSpacing: -0.6,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                handle,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Modern 3-Col Key Metrics Row
                    Row(
                      children: [
                        Expanded(child: _buildMetricBox('Audience', followersFormatted, Icons.people_alt_rounded, const Color(0xFF804EE6))),
                        const SizedBox(width: 10),
                        Expanded(child: _buildMetricBox('Rating', '$rating ★', Icons.star_rounded, const Color(0xFFD97706))),
                        const SizedBox(width: 10),
                        Expanded(child: _buildMetricBox('Engagement', '$engagement%', Icons.bolt_rounded, const Color(0xFF059669))),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // About Creator Section
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF3F4F6)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'About Creator',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            bio,
                            style: TextStyle(
                              fontSize: 13.5,
                              color: Colors.grey.shade700,
                              height: 1.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Deliverable Packages Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Deliverable Package',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                            letterSpacing: -0.3,
                          ),
                        ),
                        Text(
                          'Tap to choose',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Package Cards
                    _buildModernPackageTile(
                      packageKey: 'story',
                      icon: Icons.auto_stories_rounded,
                      title: 'Instagram Story (24h)',
                      subtitle: '1x Story slide with direct link sticker and brand tag',
                      price: widget.influencer['rates']?['story']?.toString() ?? '5,000',
                    ),
                    const SizedBox(height: 10),
                    _buildModernPackageTile(
                      packageKey: 'reel',
                      icon: Icons.movie_filter_rounded,
                      title: 'Instagram Reel (Recommended)',
                      subtitle: '30-60s HD Reel with audio sync, captions, and profile tag',
                      price: widget.influencer['rates']?['reel']?.toString() ?? '15,000',
                      isPopular: true,
                    ),
                    const SizedBox(height: 10),
                    _buildModernPackageTile(
                      packageKey: 'post',
                      icon: Icons.photo_library_rounded,
                      title: 'Dedicated Carousel Post',
                      subtitle: 'Multi-slide aesthetic photo post with detailed review caption',
                      price: widget.influencer['rates']?['post']?.toString() ?? '12,000',
                    ),

                    const SizedBox(height: 24),

                    // Campaign Creation & Brief Form
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF3F4F6)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Campaign Brief & Requirements',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Campaign Title
                          Text(
                            'CAMPAIGN NAME',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey.shade400, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: TextField(
                              controller: _campaignTitleController,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                              decoration: const InputDecoration(
                                hintText: 'e.g. Summer Collection Launch 2026',
                                hintStyle: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Instructions / Description
                          Text(
                            'CREATIVE GUIDELINES & INSTRUCTIONS',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey.shade400, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: TextField(
                              controller: _instructionController,
                              maxLines: 3,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                              decoration: const InputDecoration(
                                hintText: 'Specify key talking points, required hashtags, promo codes, or visual aesthetic...',
                                hintStyle: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w400, height: 1.4),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.all(14),
                              ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Attachment Picker
                          Text(
                            'MEDIA ASSET / MOODBOARD (OPTIONAL)',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey.shade400, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 6),
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
                                FilePickerResult? result = await FilePicker.platform.pickFiles(
                                  type: FileType.media,
                                );
                                if (result != null && result.files.single.path != null) {
                                  setState(() {
                                    _attachedFilePath = result.files.single.path;
                                    _attachedFileName = result.files.single.name;
                                  });
                                }
                              } catch (e) {
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Failed to pick media: $e')),
                                );
                              }
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                              decoration: BoxDecoration(
                                color: _attachedFilePath != null ? const Color(0xFF804EE6).withOpacity(0.06) : const Color(0xFFF9FAFB),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: _attachedFilePath != null ? const Color(0xFF804EE6) : const Color(0xFFE5E7EB),
                                  width: _attachedFilePath != null ? 1.5 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: _attachedFilePath != null ? const Color(0xFF804EE6) : Colors.grey.shade200,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      _attachedFilePath != null ? Icons.check_rounded : Icons.upload_file_rounded,
                                      color: _attachedFilePath != null ? Colors.white : Colors.grey.shade600,
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _attachedFilePath != null ? _attachedFileName! : 'Upload Brand Guidelines / Assets',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: _attachedFilePath != null ? const Color(0xFF804EE6) : const Color(0xFF374151),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _attachedFilePath != null ? 'Tap to remove attachment' : 'Images, MP4 video, or PDF',
                                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (_attachedFilePath != null)
                                    const Icon(Icons.close_rounded, size: 18, color: Colors.grey),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Escrow Protection Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF059669).withOpacity(0.2)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.shield_rounded, color: Color(0xFF059669), size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '100% Escrow Protection: Funds held securely and released only after content is delivered and approved.',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF065F46),
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      // Fixed Glassmorphism Bottom Action Bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 20,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOTAL BUDGET',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Colors.grey.shade400,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '₹$selectedPrice',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF804EE6),
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF804EE6), Color(0xFF6366F1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF804EE6).withOpacity(0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: _isBooking ? null : _handleBooking,
                    child: Center(
                      child: _isBooking
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Send Campaign Proposal',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 8),
                                Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                              ],
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricBox(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernPackageTile({
    required String packageKey,
    required IconData icon,
    required String title,
    required String subtitle,
    required String price,
    bool isPopular = false,
  }) {
    final isSelected = _selectedPackage == packageKey;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPackage = packageKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF804EE6).withOpacity(0.04) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? const Color(0xFF804EE6) : const Color(0xFFE5E7EB),
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF804EE6).withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF804EE6) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey.shade700,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                      if (isPopular) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF8A3D).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'POPULAR',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFFF8A3D),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11.5,
                      color: Colors.grey.shade500,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₹$price',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF804EE6),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? const Color(0xFF804EE6) : Colors.transparent,
                border: Border.all(
                  color: isSelected ? const Color(0xFF804EE6) : Colors.grey.shade300,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
