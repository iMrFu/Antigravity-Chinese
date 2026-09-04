"use strict";
// Defines the contract between the language server and the application hosting
// it. The host serves this over a loopback Connect listener and the language
// server calls it, so that the language server can ask the host about things
// only the host knows.
//
// This is deliberately separate from language_server.proto: a host is not
// otherwise a language server client, and should not have to depend on that
// much larger contract to answer these questions.
//
// This file is a copy. The source of truth lives in google3 at
// cs/third_party/jetski/host_bridge_pb/host_bridge.proto, and the two must be
// kept in step by hand: this repository is not part of that export.
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostBridgeService = exports.ApplyUpdateResponseSchema = exports.ApplyUpdateRequestSchema = exports.UpdateStatusSchema = exports.GetUpdateStatusResponseSchema = exports.GetUpdateStatusRequestSchema = exports.file_host_bridge = void 0;
const codegenv2_1 = require("@bufbuild/protobuf/codegenv2");
/**
 * Describes the file host_bridge.proto.
 */
exports.file_host_bridge = (0, codegenv2_1.fileDesc)("ChFob3N0X2JyaWRnZS5wcm90bxISZXhhLmhvc3RfYnJpZGdlX3BiIhgKFkdldFVwZGF0ZVN0YXR1c1JlcXVlc3QiSwoXR2V0VXBkYXRlU3RhdHVzUmVzcG9uc2USMAoGc3RhdHVzGAEgASgLMiAuZXhhLmhvc3RfYnJpZGdlX3BiLlVwZGF0ZVN0YXR1cyJZCgxVcGRhdGVTdGF0dXMSFwoPY3VycmVudF92ZXJzaW9uGAEgASgJEhYKDmxhdGVzdF92ZXJzaW9uGAIgASgJEhgKEHVwZGF0ZV9hdmFpbGFibGUYAyABKAgiFAoSQXBwbHlVcGRhdGVSZXF1ZXN0IicKE0FwcGx5VXBkYXRlUmVzcG9uc2USEAoIYWNjZXB0ZWQYASABKAgy3wEKEUhvc3RCcmlkZ2VTZXJ2aWNlEmoKD0dldFVwZGF0ZVN0YXR1cxIqLmV4YS5ob3N0X2JyaWRnZV9wYi5HZXRVcGRhdGVTdGF0dXNSZXF1ZXN0GisuZXhhLmhvc3RfYnJpZGdlX3BiLkdldFVwZGF0ZVN0YXR1c1Jlc3BvbnNlEl4KC0FwcGx5VXBkYXRlEiYuZXhhLmhvc3RfYnJpZGdlX3BiLkFwcGx5VXBkYXRlUmVxdWVzdBonLmV4YS5ob3N0X2JyaWRnZV9wYi5BcHBseVVwZGF0ZVJlc3BvbnNlYgZwcm90bzM");
/**
 * Describes the message exa.host_bridge_pb.GetUpdateStatusRequest.
 * Use `create(GetUpdateStatusRequestSchema)` to create a new message.
 */
exports.GetUpdateStatusRequestSchema = (0, codegenv2_1.messageDesc)(exports.file_host_bridge, 0);
/**
 * Describes the message exa.host_bridge_pb.GetUpdateStatusResponse.
 * Use `create(GetUpdateStatusResponseSchema)` to create a new message.
 */
exports.GetUpdateStatusResponseSchema = (0, codegenv2_1.messageDesc)(exports.file_host_bridge, 1);
/**
 * Describes the message exa.host_bridge_pb.UpdateStatus.
 * Use `create(UpdateStatusSchema)` to create a new message.
 */
exports.UpdateStatusSchema = (0, codegenv2_1.messageDesc)(exports.file_host_bridge, 2);
/**
 * Describes the message exa.host_bridge_pb.ApplyUpdateRequest.
 * Use `create(ApplyUpdateRequestSchema)` to create a new message.
 */
exports.ApplyUpdateRequestSchema = (0, codegenv2_1.messageDesc)(exports.file_host_bridge, 3);
/**
 * Describes the message exa.host_bridge_pb.ApplyUpdateResponse.
 * Use `create(ApplyUpdateResponseSchema)` to create a new message.
 */
exports.ApplyUpdateResponseSchema = (0, codegenv2_1.messageDesc)(exports.file_host_bridge, 4);
/**
 * @generated from service exa.host_bridge_pb.HostBridgeService
 */
exports.HostBridgeService = (0, codegenv2_1.serviceDesc)(exports.file_host_bridge, 0);
