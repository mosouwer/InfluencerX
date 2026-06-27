import 'package:flutter/material.dart';
import '../screens/details_screen.dart';

class InfluencerCard extends StatelessWidget {
  final Map<String, dynamic> influencer;

  const InfluencerCard({super.key, required this.influencer});

  void _navigateToDetails(BuildContext context) {
    Navigator.of(context).push(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 500),
        reverseTransitionDuration: const Duration(milliseconds: 400),
        pageBuilder: (context, animation, secondaryAnimation) {
          return FadeTransition(
            opacity: animation,
            child: DetailsScreen(influencer: influencer),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _navigateToDetails(context),
      child: Card(
        margin: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Header
            Hero(
              tag: 'image_${influencer['id']}',
              child: Container(
                height: 180,
                width: double.infinity,
                color: Theme.of(context).colorScheme.surfaceVariant,
                child: Image.network(
                  influencer['image'],
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Hero(
                                    tag: 'name_${influencer['id']}',
                                    child: Material(
                                      color: Colors.transparent,
                                      child: Text(
                                        influencer['name'],
                                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: -0.5,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ),
                                ),
                                if (influencer['verified'] == true) ...[
                                  const SizedBox(width: 6),
                                  Icon(Icons.verified, color: Theme.of(context).colorScheme.primary, size: 20),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '@${influencer['name'].toString().toLowerCase().replaceAll(' ', '')}',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.people, color: Theme.of(context).colorScheme.onPrimaryContainer, size: 14),
                            const SizedBox(width: 6),
                            Text(
                              _formatFollowers(influencer['followers']),
                              style: TextStyle(color: Theme.of(context).colorScheme.onPrimaryContainer, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Icon(Icons.local_offer_outlined, color: Theme.of(context).colorScheme.onSurfaceVariant, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Starts with ₹${influencer['rates']?['story'] ?? '5,000'}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          influencer['niche'],
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      FilledButton.tonal(
                        style: FilledButton.styleFrom(
                          visualDensity: VisualDensity.standard,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                        ),
                        onPressed: () => _navigateToDetails(context),
                        child: const Text('View Profile', style: TextStyle(fontSize: 13)),
                      )
                    ],
                  )
                ],
              ),
            ),
          ],
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
