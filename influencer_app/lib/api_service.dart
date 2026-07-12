import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;

class ApiService {
  static String? _userId;
  static String? _userRole;
  
  // Using local network IP so physical devices on the same Wi-Fi can connect
  static String get baseUrl {
    return 'https://influencer-x-mocha.vercel.app/api';
  }

  static Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_userId != null) {
      headers['x-user-id'] = _userId!;
    }
    if (_userRole != null) {
      headers['x-user-role'] = _userRole!;
    }
    return headers;
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _userId = data['user']['id'];
      _userRole = data['user']['role'];
      return data;
    } else {
      throw Exception('Login failed: ${json.decode(response.body)['error'] ?? response.statusCode}');
    }
  }

  static Future<List<dynamic>> getInfluencers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/influencers'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load influencers: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to connect to the server. Is it running? Error: $e');
    }
  }

  static Future<Map<String, dynamic>> createDeal(String influencerId, String packageType, {String? instructions, String? mediaPath}) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/deals'));
    
    // Add headers including cookie if logged in
    request.headers.addAll(_headers);
    request.headers.remove('Content-Type'); // Let MultipartRequest set the correct boundary header

    // Add text fields
    request.fields['influencerId'] = influencerId;
    request.fields['packageType'] = packageType;
    request.fields['message'] = (instructions != null && instructions.trim().isNotEmpty) ? instructions : 'Interested in collaborating on a $packageType campaign.';
    request.fields['hasMedia'] = mediaPath != null ? 'true' : 'false';

    // Add file if attached
    if (mediaPath != null && mediaPath.isNotEmpty) {
      request.files.add(await http.MultipartFile.fromPath('media', mediaPath));
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final body = response.body;
      String errorMsg = 'Failed to create deal (Status ${response.statusCode})';
      try {
        final decoded = json.decode(body);
        final error = decoded['error'] ?? '';
        final details = decoded['details'] ?? '';
        errorMsg = 'Failed to create deal: $error${details.isNotEmpty ? ' - $details' : ''}';
      } catch (_) {
        errorMsg = '$errorMsg: $body';
      }
      throw Exception(errorMsg);
    }
  }

  static Future<List<dynamic>> getCampaigns() async {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    final dealsResponse = await http.get(
      Uri.parse('$baseUrl/deals?_t=$timestamp'),
      headers: _headers,
    );
    
    final campaignsResponse = await http.get(
      Uri.parse('$baseUrl/campaigns?_t=$timestamp'),
      headers: _headers,
    );
    
    if (dealsResponse.statusCode == 200 && campaignsResponse.statusCode == 200) {
      List<dynamic> deals = json.decode(dealsResponse.body);
      List<dynamic> campaigns = json.decode(campaignsResponse.body);
      
      for (var d in deals) { d['isDeal'] = true; }
      for (var c in campaigns) { c['isDeal'] = false; }
      
      var combined = [...deals, ...campaigns];
      combined.sort((a, b) {
        String dateA = a['createdAt'] ?? '';
        String dateB = b['createdAt'] ?? '';
        return dateB.compareTo(dateA);
      });
      return combined;
    } else {
      throw Exception('Failed to load campaigns and deals');
    }
  }

  static Future<void> updateDealStatus(String dealId, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/deals/$dealId/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update deal status');
    }
  }

  static Future<void> updateCampaignStatus(String campaignId, String status) async {
    final response = await http.put(
      Uri.parse('$baseUrl/campaigns/$campaignId/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update campaign status');
    }
  }
}
