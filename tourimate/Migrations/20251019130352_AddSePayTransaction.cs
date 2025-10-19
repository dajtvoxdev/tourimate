using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddSePayTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("719368e0-e3a0-4906-99ff-0e5abda04a3e"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a3146cb8-de51-4642-9f6b-4d297f8fa430"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("e2307045-84c4-437f-b516-944e17628153"));

            migrationBuilder.CreateTable(
                name: "SePayTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SePayTransactionId = table.Column<int>(type: "int", nullable: false),
                    Gateway = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccountNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TransferType = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TransferAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Accumulated = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SubAccount = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ReferenceCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EntityType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ProcessingStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProcessingNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SePayTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SePayTransactions_Bookings_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Bookings",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SePayTransactions_Orders_EntityId",
                        column: x => x.EntityId,
                        principalTable: "Orders",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2791), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2791) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2796), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2797) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2800), new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(2801) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("214c7489-24f3-4b72-97c7-5effd7286d15"), "Finance", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3021), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3021), "0.15" },
                    { new Guid("7f5cb398-f4c0-4d8a-99eb-74985aa0a4bd"), "Finance", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3017), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3018), "0.15" },
                    { new Guid("925a5c02-17b9-4535-9faf-01777f74a7e7"), "Security", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3024), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 19, 13, 3, 51, 500, DateTimeKind.Utc).AddTicks(3025), "5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SePayTransactions_EntityId",
                table: "SePayTransactions",
                column: "EntityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SePayTransactions");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("214c7489-24f3-4b72-97c7-5effd7286d15"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("7f5cb398-f4c0-4d8a-99eb-74985aa0a4bd"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("925a5c02-17b9-4535-9faf-01777f74a7e7"));

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4398), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4399) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4403), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4404) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4407), new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4408) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("719368e0-e3a0-4906-99ff-0e5abda04a3e"), "Security", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4659), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4660), "5" },
                    { new Guid("a3146cb8-de51-4642-9f6b-4d297f8fa430"), "Finance", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4641), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4641), "0.15" },
                    { new Guid("e2307045-84c4-437f-b516-944e17628153"), "Finance", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4645), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 14, 2, 47, 29, 126, DateTimeKind.Utc).AddTicks(4645), "0.15" }
                });
        }
    }
}
